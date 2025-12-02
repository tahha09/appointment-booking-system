<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Appointment;
use App\Models\Doctor;

class AppointmentController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function dashboard()
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            $patientId = $user->patient->id;
            $today = now()->toDateString();

            // Get today's appointments
            $todayAppointments = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->where('appointment_date', $today)
                ->count();

            // Get upcoming appointments
            $upcomingAppointments = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->where('appointment_date', '>', $today)
                ->whereIn('status', ['pending', 'confirmed'])
                ->count();

            // Get total appointments
            $totalAppointments = Appointment::where('patient_id', $patientId)->count();

            // Get recent appointments
            $recentAppointments = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->orderBy('appointment_date', 'desc')
                ->orderBy('start_time', 'desc')
                ->take(5)
                ->get();

            // Get appointment statistics by status
            $stats = [
                'pending' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'pending')
                    ->count(),
                'confirmed' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'confirmed')
                    ->count(),
                'completed' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'completed')
                    ->count(),
                'cancelled' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'cancelled')
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'today_appointments' => $todayAppointments,
                    'upcoming_appointments' => $upcomingAppointments,
                    'total_appointments' => $totalAppointments,
                    'recent_appointments' => $recentAppointments,
                    'stats' => $stats,
                ],
                'message' => 'Dashboard data retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all appointments with filters
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            $patientId = $user->patient->id;
            $query = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId);

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->has('date_from')) {
                $query->where('appointment_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('appointment_date', '<=', $request->date_to);
            }

            // Filter by doctor
            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            // Order by date and time
            $query->orderBy('appointment_date', 'desc')
                  ->orderBy('start_time', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $appointments = $query->paginate($perPage);

            // Get appointment statistics
            $stats = [
                'pending' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'pending')
                    ->count(),
                'confirmed' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'confirmed')
                    ->count(),
                'completed' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'completed')
                    ->count(),
                'cancelled' => Appointment::where('patient_id', $patientId)
                    ->where('status', 'cancelled')
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'appointments' => $appointments->items(),
                    'pagination' => [
                        'current_page' => $appointments->currentPage(),
                        'last_page' => $appointments->lastPage(),
                        'per_page' => $appointments->perPage(),
                        'total' => $appointments->total(),
                    ],
                    'stats' => $stats
                ],
                'message' => 'Appointments retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single appointment
     */
    public function show($id)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            $patientId = $user->patient->id;

            $appointment = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->find($id);

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $appointment,
                'message' => 'Appointment retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel appointment
     */
    public function cancel(Request $request, $id)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            $patientId = $user->patient->id;

            $appointment = Appointment::where('patient_id', $patientId)
                ->where('id', $id)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment not found.'
                ], 404);
            }

            // Check if appointment can be cancelled
            if ($appointment->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment is already cancelled.'
                ], 400);
            }

            if ($appointment->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel completed appointment.'
                ], 400);
            }

            // Cancel the appointment
            $appointment->update([
                'status' => 'cancelled'
            ]);

            return response()->json([
                'success' => true,
                'data' => $appointment,
                'message' => 'Appointment cancelled successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Book new appointment
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            // Validate request
            $validated = $request->validate([
                'doctor_id' => 'required|exists:doctors,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'reason' => 'required|string|max:500',
                'notes' => 'nullable|string|max:1000',
            ]);

            $patientId = $user->patient->id;

            // Check doctor availability
            $doctor = Doctor::find($validated['doctor_id']);
            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Doctor not found.'
                ], 404);
            }

            // Check if slot is available
            $existingAppointment = Appointment::where('doctor_id', $validated['doctor_id'])
                ->where('appointment_date', $validated['appointment_date'])
                ->where('start_time', $validated['start_time'])
                ->whereIn('status', ['pending', 'confirmed'])
                ->first();

            if ($existingAppointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'This time slot is already booked.'
                ], 400);
            }

            // Create appointment with available fields only
            $appointment = Appointment::create([
                'patient_id' => $patientId,
                'doctor_id' => $validated['doctor_id'],
                'appointment_date' => $validated['appointment_date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'status' => 'pending',
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                // Note: fee, appointment_type, is_emergency not included as they don't exist in migration
            ]);

            $appointment->load(['doctor.user', 'doctor.specialization']);

            return response()->json([
                'success' => true,
                'data' => $appointment,
                'message' => 'Appointment booked successfully'
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get medical records (completed appointments)
     */
    public function medicalRecords()
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            $patientId = $user->patient->id;

            $records = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->where('status', 'completed')
                ->orderBy('appointment_date', 'desc')
                ->orderBy('start_time', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $records,
                'message' => 'Medical records retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single medical record
     */
    public function medicalRecord($id)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authenticated patient not found.'
                ], 404);
            }

            $patientId = $user->patient->id;

            $appointment = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->where('id', $id)
                ->where('status', 'completed')
                ->first();

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Medical record not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $appointment,
                'message' => 'Medical record retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}