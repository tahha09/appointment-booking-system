<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\Specialization;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    use ApiResponse;

    // Public method - get all doctors (no auth required)
    public function indexPublic(Request $request)
    {
        try {
            $query = Doctor::with(['user', 'specialization'])
                ->where('is_approved', true);

            // Filter by specialization
            if ($request->has('specialization_id')) {
                $query->where('specialization_id', $request->specialization_id);
            }

            // Search by name
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            }

            $doctors = $query->orderBy('rating', 'desc')->paginate(12);

            return response()->json([
                'success' => true,
                'message' => 'Doctors retrieved successfully',
                'data' => [
                    'doctors' => DoctorResource::collection($doctors),
                    'pagination' => [
                        'current_page' => $doctors->currentPage(),
                        'last_page' => $doctors->lastPage(),
                        'per_page' => $doctors->perPage(),
                        'total' => $doctors->total(),
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

    // Public method - get single doctor (no auth required)
    public function showPublic($id)
    {
        try {
            $doctor = Doctor::with(['user', 'specialization'])
                ->where('is_approved', true)
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Doctor retrieved successfully',
                'data' => new DoctorResource($doctor)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor not found'
            ], 404);
        }
    }

    // Public method - check availability (no auth required)
    public function availabilityPublic($id, Request $request)
    {
        try {
            $doctor = Doctor::where('is_approved', true)->findOrFail($id);

            $date = $request->get('date', now()->format('Y-m-d'));

            $availability = [
                'doctor_id' => $doctor->id,
                'date' => $date,
                'available_slots' => ['09:00', '10:00', '11:00', '14:00', '15:00'],
                'is_available' => true
            ];

            return response()->json([
                'success' => true,
                'message' => 'Availability checked successfully',
                'data' => $availability
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor not found'
            ], 404);
        }
    }
}
