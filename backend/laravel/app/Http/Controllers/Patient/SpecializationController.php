<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpecializationResource;
use App\Models\Specialization;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SpecializationController extends Controller
{
    use ApiResponse;

    // Public method - get all specializations with filters
    public function index(Request $request)
    {
        try {
            $query = Specialization::query();

            // Search by name or description
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            // Filter by multiple specialization IDs
            if ($request->has('specialization_ids') && !empty($request->specialization_ids)) {
                $specializationIds = explode(',', $request->specialization_ids);
                $query->whereIn('id', $specializationIds);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 12);
            $specializations = $query->paginate($perPage);

            // Add doctors count to each specialization
            $specializations->getCollection()->transform(function ($specialization) {
                $specialization->doctors_count = $specialization->doctors()
                    ->where('is_approved', true)
                    ->count();
                return $specialization;
            });

            return response()->json([
                'success' => true,
                'message' => 'Specializations retrieved successfully',
                'data' => [
                    'specializations' => SpecializationResource::collection($specializations),
                    'pagination' => [
                        'current_page' => $specializations->currentPage(),
                        'last_page' => $specializations->lastPage(),
                        'per_page' => $specializations->perPage(),
                        'total' => $specializations->total(),
                    ],
                    'filters' => [
                        'search' => $request->search,
                        'specialization_ids' => $request->specialization_ids ? explode(',', $request->specialization_ids) : [],
                        'sort_by' => $sortBy,
                        'sort_order' => $sortOrder,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Get single specialization with details
    public function show($id)
    {
        try {
            $specialization = Specialization::with(['doctors.user'])
                ->findOrFail($id);

            // Add doctors count
            $specialization->doctors_count = $specialization->doctors()
                ->where('is_approved', true)
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'Specialization retrieved successfully',
                'data' => new SpecializationResource($specialization)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Specialization not found'
            ], 404);
        }
    }

    // Get all specializations for filter list (without pagination)
    public function filterList(Request $request)
    {
        try {
            $specializations = Specialization::select('id', 'name', 'description')
                ->orderBy('name', 'asc')
                ->get();

            // Add doctors count to each
            $specializations->transform(function ($specialization) {
                $specialization->doctors_count = $specialization->doctors()
                    ->where('is_approved', true)
                    ->count();
                return $specialization;
            });

            return response()->json([
                'success' => true,
                'message' => 'Specializations filter list retrieved successfully',
                'data' => $specializations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
