<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\MedicalNote;
use App\Traits\ApiResponse;

class AppointmentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $query = Appointment::with(['patient.user', 'doctor.user'])
                ->forDoctor($doctorId);

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

            // Order by date and time
            $query->orderBy('appointment_date', 'desc')
                  ->orderBy('start_time', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $appointments = $query->paginate($perPage);

            return $this->success([
                'appointments' => $appointments->items(),
                'pagination' => [
                    'current_page' => $appointments->currentPage(),
                    'last_page' => $appointments->lastPage(),
                    'per_page' => $appointments->perPage(),
                    'total' => $appointments->total(),
                ]
            ], 'Appointments retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->doctor) {
            return $this->error('Authenticated doctor not found.', 404);
        }

        $appointment = Appointment::with([
                'patient.user',
                'doctor.user',
                'medicalNote',
            ])
            ->forDoctor($user->doctor->id)
            ->find($id);

        if (!$appointment) {
            return $this->error('Appointment not found.', 404);
        }

        return $this->success($appointment, 'Appointment retrieved successfully');
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $validated = $request->validate([
                'status' => 'required|in:pending,confirmed,completed,cancelled,rejected',
            ]);

            $appointment = Appointment::forDoctor($user->doctor->id)->find($id);

            if (!$appointment) {
                return $this->error('Appointment not found.', 404);
            }

            $appointment->update(['status' => $validated['status']]);

            return $this->success($appointment, 'Appointment status updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function addMedicalNotes(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $validated = $request->validate([
                'diagnosis' => 'nullable|string',
                'treatment' => 'nullable|string',
                'prescription' => 'nullable|string',
                'follow_up_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            $appointment = Appointment::forDoctor($user->doctor->id)->find($id);

            if (!$appointment) {
                return $this->error('Appointment not found.', 404);
            }

            $medicalNote = MedicalNote::updateOrCreate(
                ['appointment_id' => $id],
                $validated
            );

            return $this->success($medicalNote, 'Medical notes added successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function dashboard(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;

            $today = now()->toDateString();

            // Get today's appointments
            $todayAppointments = Appointment::where('doctor_id', $doctorId)
                ->where('appointment_date', $today)
                ->count();

            // Get upcoming appointments
            $upcomingAppointments = Appointment::where('doctor_id', $doctorId)
                ->where('appointment_date', '>', $today)
                ->count();

            // Get total patients
            $totalPatients = Appointment::where('doctor_id', $doctorId)
                ->distinct('patient_id')
                ->count('patient_id');

            // Get recent appointments
            $recentAppointments = Appointment::with(['patient.user'])
                ->where('doctor_id', $doctorId)
                ->orderBy('appointment_date', 'desc')
                ->limit(5)
                ->get();

            return $this->success([
                'today_appointments' => $todayAppointments,
                'upcoming_appointments' => $upcomingAppointments,
                'total_patients' => $totalPatients,
                'recent_appointments' => $recentAppointments,
            ], 'Dashboard data retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
