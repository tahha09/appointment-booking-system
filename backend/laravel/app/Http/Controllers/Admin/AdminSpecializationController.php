<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Traits\ApiResponse;

class AdminSpecializationController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of the specializations.
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 5);
            $search = $request->get('search', '');

            $query = Specialization::withCount('doctors');

            // Apply search filter
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                        ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Sort by newest first
            $query->orderBy('created_at', 'desc');

            $specializations = $query->paginate($perPage);

            // Transform to match Angular's expected format
            return response()->json([
                'data' => $specializations->items(),
                'meta' => [
                    'current_page' => $specializations->currentPage(),
                    'last_page' => $specializations->lastPage(),
                    'per_page' => $specializations->perPage(),
                    'total' => $specializations->total(),
                    'from' => $specializations->firstItem(),
                    'to' => $specializations->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->error('Failed to retrieve specializations', 500);
        }
    }

    /**
     * Store a newly created specialization.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:specializations,name',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        try {
            $specialization = Specialization::create($request->only(['name', 'description']));

            // Load doctors count
            $specialization->loadCount('doctors');

            return $this->success($specialization, 'Specialization created successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to create specialization', 500);
        }
    }

    /**
     * Display the specified specialization.
     */
    public function show($id)
    {
        try {
            $specialization = Specialization::withCount('doctors')->findOrFail($id);

            return $this->success($specialization, 'Specialization retrieved successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Specialization not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve specialization', 500);
        }
    }

    /**
     * Update the specified specialization.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:specializations,name,' . $id,
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        try {
            $specialization = Specialization::findOrFail($id);
            $specialization->update($request->only(['name', 'description']));

            // Load doctors count
            $specialization->loadCount('doctors');

            return $this->success($specialization, 'Specialization updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Specialization not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to update specialization', 500);
        }
    }

    /**
     * Remove the specified specialization.
     */
    public function destroy($id)
    {
        try {
            $specialization = Specialization::findOrFail($id);

            // Check if specialization has doctors
            if ($specialization->doctors()->count() > 0) {
                return $this->error('Cannot delete specialization with associated doctors', 422);
            }

            $specialization->delete();

            return $this->success(null, 'Specialization deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->error('Specialization not found', 404);
        } catch (\Exception $e) {
            return $this->error('Failed to delete specialization', 500);
        }
    }
    public function getDoctors($id)
    {
        try {
            $specialization = Specialization::findOrFail($id);
            $doctors = $specialization->doctors()
                ->with('user')
                ->select('doctors.*')
                ->get()
                ->map(function ($doctor) {
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->user->name,
                        'email' => $doctor->user->email,
                        'phone' => $doctor->user->phone,
                        'experience_years' => $doctor->experience_years,
                        'consultation_fee' => $doctor->consultation_fee,
                        'is_approved' => $doctor->is_approved,
                        'rating' => $doctor->rating,
                        'total_reviews' => $doctor->total_reviews,
                        'specialization_id' => $doctor->specialization_id,
                        'user_id' => $doctor->user_id,
                        'created_at' => $doctor->created_at,
                        'updated_at' => $doctor->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $doctors
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Specialization not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve doctors',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
