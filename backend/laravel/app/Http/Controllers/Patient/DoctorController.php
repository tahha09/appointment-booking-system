<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\Specialization;
use App\Models\Schedule;
use App\Models\Holiday;
use App\Models\Appointment;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    /**
     * Public method - get top rated doctors (no auth required)
     */
    public function topRated(Request $request)
    {
        try {
            $limit = (int) $request->get('limit', 5);
            $doctors = Doctor::with(['user', 'specialization'])
                ->where('is_approved', true)
                ->orderByDesc('rating')
                ->take($limit)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Top rated doctors retrieved successfully',
                'data' => DoctorResource::collection($doctors),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Public method - get single doctor (no auth required)
    public function showPublic($id)
    {
        try {
            $doctor = Doctor::with(['user', 'specialization', 'certificates'])
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
            $date = $this->resolveDate($request->get('date'));

            $availability = $this->buildAvailabilityPayload($doctor, $date);

            return response()->json([
                'success' => true,
                'message' => $availability['is_available']
                    ? 'Availability checked successfully'
                    : ($availability['reason'] ?? 'Doctor is not available on the selected date.'),
                'data' => $availability,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor not found'
            ], 404);
        }
    }

    // Authenticated patients - check availability with block validation
    public function availability($id, Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.',
                ], 404);
            }

            $doctor = Doctor::where('is_approved', true)->findOrFail($id);

            $patientId = $user->patient->id;
            $isBlocked = DB::table('blocked_patients')
                ->where('doctor_id', $doctor->id)
                ->where('patient_id', $patientId)
                ->exists();

            if ($isBlocked) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are blocked from booking appointments with this doctor.',
                ], 403);
            }

            $date = $this->resolveDate($request->get('date'));
            $availability = $this->buildAvailabilityPayload($doctor, $date);

            return response()->json([
                'success' => true,
                'message' => $availability['is_available']
                    ? 'Availability checked successfully'
                    : ($availability['reason'] ?? 'Doctor is not available on the selected date.'),
                'data' => $availability,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor not found'
            ], 404);
        }
    }

    private function resolveDate(?string $dateInput): Carbon
    {
        try {
            return $dateInput
                ? Carbon::parse($dateInput)->startOfDay()
                : Carbon::today();
        } catch (\Exception $e) {
            return Carbon::today();
        }
    }

    private function buildAvailabilityPayload(Doctor $doctor, Carbon $date): array
    {
        $dateString = $date->toDateString();

        $holiday = Holiday::where('doctor_id', $doctor->id)
            ->whereDate('holiday_date', $dateString)
            ->first();

        if ($holiday) {
            return [
                'doctor_id' => $doctor->id,
                'date' => $dateString,
                'available_slots' => [],
                'is_available' => false,
                'reason' => 'Doctor is on holiday',
                'holiday_reason' => $holiday->reason,
            ];
        }

        $dayOfWeek = $date->dayOfWeek;

        $schedules = Schedule::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->orderBy('start_time')
            ->get();

        if ($schedules->isEmpty()) {
            return [
                'doctor_id' => $doctor->id,
                'date' => $dateString,
                'available_slots' => [],
                'is_available' => false,
                'reason' => 'No working hours configured for this day.',
            ];
        }

        $existingAppointments = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $dateString)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get()
            ->map(function ($appointment) use ($dateString) {
                return [
                    'start' => Carbon::parse("{$dateString} {$appointment->start_time}"),
                    'end' => Carbon::parse("{$dateString} {$appointment->end_time}"),
                ];
            });

        $slotDurationMinutes = 60;
        $availableSlots = [];

        foreach ($schedules as $schedule) {
            $slotStart = Carbon::parse("{$dateString} {$schedule->start_time}");
            $scheduleEnd = Carbon::parse("{$dateString} {$schedule->end_time}");

            while ($slotStart->lt($scheduleEnd)) {
                $slotEnd = $slotStart->copy()->addMinutes($slotDurationMinutes);

                if ($slotEnd->gt($scheduleEnd)) {
                    break;
                }

                $hasConflict = $existingAppointments->contains(function ($appointment) use ($slotStart, $slotEnd) {
                    return $slotStart->lt($appointment['end']) && $slotEnd->gt($appointment['start']);
                });

                if (!$hasConflict) {
                    $availableSlots[] = $slotStart->format('H:i');
                }

                $slotStart->addMinutes($slotDurationMinutes);
            }
        }

        return [
            'doctor_id' => $doctor->id,
            'date' => $dateString,
            'available_slots' => $availableSlots,
            'is_available' => count($availableSlots) > 0,
        ];
    }
}
