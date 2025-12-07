<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Holiday;
use Carbon\Carbon;
use App\Notifications\DoctorNotifications;

class AppointmentController extends Controller
{
    use ApiResponse;
    /**
     * Get dashboard statistics
     */
    public function dashboard()
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
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

            return $this->success([
                'today_appointments' => $todayAppointments,
                'upcoming_appointments' => $upcomingAppointments,
                'total_appointments' => $totalAppointments,
                'recent_appointments' => $recentAppointments,
                'stats' => $stats,
            ], 'Dashboard data retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
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
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;
            $query = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId);

            // Search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('reason', 'like', "%{$search}%")
                      ->orWhere('notes', 'like', "%{$search}%")
                      ->orWhereHas('doctor.user', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('doctor.specialization', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }

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


            $perPage = $request->input('per_page', 8);
            $appointments = $query->paginate($perPage);

            return $this->success($appointments, 'Appointments retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
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
                return $this->error('Appointment not found.', 404);
            }

            return $this->success($appointment, 'Appointment retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Accept/Confirm appointment
     */
    public function accept(Request $request, $id)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;

            $appointment = Appointment::where('patient_id', $patientId)
                ->where('id', $id)
                ->first();

            if (!$appointment) {
                return $this->error('Appointment not found.', 404);
            }

            // Check if appointment can be accepted
            if ($appointment->status === 'confirmed') {
                return $this->error('Appointment is already confirmed.', 400);
            }

            if ($appointment->status === 'cancelled') {
                return $this->error('Cannot accept cancelled appointment.', 400);
            }

            if ($appointment->status === 'completed') {
                return $this->error('Cannot accept completed appointment.', 400);
            }

            // Confirm the appointment
            $appointment->update([
                'status' => 'confirmed'
            ]);

            $appointment->load(['doctor.user', 'doctor.specialization']);

            return $this->success($appointment, 'Appointment confirmed successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
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
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;

            $appointment = Appointment::where('patient_id', $patientId)
                ->where('id', $id)
                ->first();

            if (!$appointment) {
                return $this->error('Appointment not found.', 404);
            }

            // Check if appointment can be cancelled
            if ($appointment->status === 'cancelled') {
                return $this->error('Appointment is already cancelled.', 400);
            }

            if ($appointment->status === 'completed') {
                return $this->error('Cannot cancel completed appointment.', 400);
            }

            // Cancel the appointment
            $appointment->update([
                'status' => 'cancelled'
            ]);

            $appointmentDate = $appointment->appointment_date;
            $appointmentTime = $appointment->start_time;

            if ($appointment->doctor) {
                $doctor = Doctor::with('user')->find($appointment->doctor_id);
                if ($doctor && $doctor->user) {
                    $doctor->user->notify(new DoctorNotifications('appointment_cancelled', [
                        'title' => 'Appointment Cancelled',
                        'message' => "A patient has cancelled an appointment scheduled for {$appointmentDate} at {$appointmentTime}.",
                        'type' => 'warning',
                        'related_appointment_id' => $appointment->id,
                        'subject' => 'Appointment Cancellation Notification',
                    ]));
                }
            }

            $appointment->load(['doctor.user', 'doctor.specialization']);

            return $this->success($appointment, 'Appointment cancelled successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
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
                return $this->error('Authenticated patient not found.', 404);
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
            $doctorId = $validated['doctor_id'];
            $appointmentDate = Carbon::parse($validated['appointment_date']);
            $startDateTime = Carbon::parse($validated['appointment_date'] . ' ' . $validated['start_time']);
            $startTime = $validated['start_time'];
            $endTime = $validated['end_time'];

            if ($startDateTime->lt(Carbon::now())) {
                return $this->error('You cannot book an appointment in the past.', 422);
            }

            // Check doctor availability
            $doctor = Doctor::find($doctorId);
            if (!$doctor) {
                return $this->error('Doctor not found.', 404);
            }

            $isBlockedByDoctor = DB::table('blocked_patients')
                ->where('doctor_id', $doctorId)
                ->where('patient_id', $patientId)
                ->exists();

            if ($isBlockedByDoctor) {
                return $this->error('This doctor has restricted new appointments with your account.', 403);
            }

            $isDoctorOnHoliday = Holiday::where('doctor_id', $doctorId)
                ->whereDate('holiday_date', $appointmentDate->format('Y-m-d'))
                ->exists();

            if ($isDoctorOnHoliday) {
                return $this->error('The doctor is unavailable on the selected date due to a scheduled holiday.', 422);
            }

            $overlappingAppointment = Appointment::where('patient_id', $patientId)
                ->where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $appointmentDate->format('Y-m-d'))
                ->whereIn('status', ['pending', 'confirmed'])
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                })
                ->exists();

            if ($overlappingAppointment) {
                return $this->error('You already have an appointment with this doctor during the selected time.', 422);
            }

            // Check if slot is available
            $existingAppointment = Appointment::where('doctor_id', $doctorId)
                ->where('appointment_date', $validated['appointment_date'])
                ->where('start_time', $validated['start_time'])
                ->whereIn('status', ['pending', 'confirmed'])
                ->first();

            if ($existingAppointment) {
                return $this->error('This time slot is already booked.', 400);
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

            $doctor = Doctor::with('user')->find($appointment->doctor_id);

if ($doctor && $doctor->user) {
    $doctor->user->notify(new DoctorNotifications('appointment_booked', [
        'title' => 'New Appointment Booked',
        'message' => "A patient has booked a new appointment on {$validated['appointment_date']} at {$validated['start_time']}.",
        'type' => 'info',
        'related_appointment_id' => $appointment->id,
        'subject' => 'New Appointment Booking Notification',
    ]));
}

            $appointment->load(['doctor.user', 'doctor.specialization']);

            return $this->success($appointment, 'Appointment booked successfully', 201);
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
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
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;

            $records = Appointment::with(['doctor.user', 'doctor.specialization'])
                ->where('patient_id', $patientId)
                ->where('status', 'completed')
                ->orderBy('appointment_date', 'desc')
                ->orderBy('start_time', 'desc')
                ->get();

            return $this->success($records, 'Medical records retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
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
                return $this->error('Medical record not found.', 404);
            }

            return $this->success($appointment, 'Medical record retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
 * Reschedule appointment
 */
public function reschedule(Request $request, $id)
{
    try {
        $user = Auth::user();

        if (!$user || !$user->patient) {
            return $this->error('Authenticated patient not found.', 404);
        }

        $patientId = $user->patient->id;

        $validated = $request->validate([
            'appointment_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'reason_for_reschedule' => 'nullable|string|max:500',
        ]);

        $appointment = Appointment::where('patient_id', $patientId)
            ->where('id', $id)
            ->first();

        if (!$appointment) {
            return $this->error('Appointment not found.', 404);
        }

        if ($appointment->status !== 'confirmed') {
            return $this->error('Only confirmed appointments can be rescheduled.', 400);
        }

        if ($appointment->reschedule_count >= 3) {
            return $this->error('This appointment has reached the maximum reschedule limit (3 times).', 400);
        }

        $originalDateTime = Carbon::parse(
            $appointment->appointment_date->format('Y-m-d') . ' ' . $appointment->start_time
        );

        if ($originalDateTime->lt(Carbon::now())) {
            return $this->error('Cannot reschedule an appointment that has already passed.', 400);
        }

        $today = Carbon::today();
        $appointmentDateObj = Carbon::parse($appointment->appointment_date);
        
        if ($today->isSameDay($appointmentDateObj)) {
            return $this->error('Cannot reschedule an appointment on the same day.', 400);
        }

        $hoursDifference = $originalDateTime->diffInHours(Carbon::now(), false);
        $minimumHoursBeforeAppointment = 4; // 
        
        if ($hoursDifference > -$minimumHoursBeforeAppointment) {
            return $this->error("Cannot reschedule an appointment less than {$minimumHoursBeforeAppointment} hours before the scheduled time.", 400);
        }

        // Clean the date
        $appointmentDate = $validated['appointment_date'];
        if (str_contains($appointmentDate, 'T')) {
            $appointmentDate = substr($appointmentDate, 0, 10);
        }

        // FIX: Use Carbon::parse correctly
        $startDateTime = Carbon::parse($appointmentDate . ' ' . $validated['start_time']);
        $endDateTime = Carbon::parse($appointmentDate . ' ' . $validated['end_time']);
        
        // FIX: Calculate originalDateTime correctly
        // Correct way:
        $originalDateTime = Carbon::parse(
            $appointment->appointment_date->format('Y-m-d') . ' ' . $appointment->start_time
        );
        
        // Alternative way:
        // $originalDateTime = $appointment->appointment_date->copy()
        //     ->setTimeFromTimeString($appointment->start_time);

        if ($startDateTime->lt($originalDateTime)) {
            return $this->error('You cannot reschedule to a time earlier than the original appointment.', 422);
        }

        if ($startDateTime->lt(Carbon::now())) {
            return $this->error('You cannot reschedule to a past time.', 422);
        }

        // Remaining checks...
        // Check if there is another appointment with the same doctor on the same day
        $sameDayAppointment = Appointment::where('patient_id', $patientId)
            ->where('doctor_id', $appointment->doctor_id)
            ->where('id', '!=', $id)
            ->whereDate('appointment_date', $appointmentDate)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($sameDayAppointment) {
            return $this->error('You already have another appointment with this doctor on the selected day.', 422);
        }

        // Check if there is another appointment at the same time with a different doctor
        $sameTimeOtherDoctor = Appointment::where('patient_id', $patientId)
            ->where('doctor_id', '!=', $appointment->doctor_id)
            ->where('id', '!=', $id)
            ->whereDate('appointment_date', $appointmentDate)
            ->where('start_time', $validated['start_time'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($sameTimeOtherDoctor) {
            return $this->error('You have another appointment at the same time with a different doctor.', 422);
        }

        // Check if the time slot is already booked with the same doctor
        $timeConflictSameDoctor = Appointment::where('doctor_id', $appointment->doctor_id)
            ->where('id', '!=', $id)
            ->whereDate('appointment_date', $appointmentDate)
            ->where('start_time', $validated['start_time'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($timeConflictSameDoctor) {
            return $this->error('This time slot is already booked with the doctor.', 400);
        }

        if ($endDateTime->lte($startDateTime)) {
            return $this->error('End time must be after start time.', 422);
        }

        $oldDate = $appointment->appointment_date;
        $oldTime = $appointment->start_time;
        $oldDateFormatted = Carbon::parse($oldDate)->format('Y-m-d');

        // Save original appointment data (only the first time)
        if (is_null($appointment->rescheduled_at)) {
            $appointment->update([
                'original_appointment_date' => $appointment->appointment_date,
                'original_start_time' => $appointment->start_time,
                'original_end_time' => $appointment->end_time,
            ]);
        }

        // Update the appointment
        $appointment->update([
            'appointment_date' => $appointmentDate,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'pending',
            'rescheduled_at' => now(),
            'reschedule_reason' => $validated['reason_for_reschedule'] ?? null,
            'reschedule_count' => $appointment->reschedule_count + 1,
        ]);

        if ($appointment->doctor) {
                $doctor = Doctor::with('user')->find($appointment->doctor_id);
                if ($doctor && $doctor->user) {
                    $newTime = $validated['start_time'];
                    $reason = $validated['reason_for_reschedule'] ?? 'No reason provided';
                    
                    $doctor->user->notify(new DoctorNotifications('appointment_rescheduled', [
                        'title' => 'Appointment Rescheduled',
                        'message' => "A patient has rescheduled an appointment:\n\n" .
                                    "Old Date: {$oldDateFormatted}\n" .
                                    "Old Time: {$oldTime}\n" .
                                    "New Date: {$appointmentDate}\n" .
                                    "New Time: {$newTime}\n" .
                                    "Reason: {$reason}\n\n" .
                                    "Please confirm the new appointment time.",
                        'type' => 'info',
                        'related_appointment_id' => $appointment->id,
                        'subject' => 'Appointment Rescheduling Notification',
                    ]));
                }
            }

        $appointment->load(['doctor.user', 'doctor.specialization']);

        return $this->success([
            'appointment' => $appointment,
            'message' => 'Appointment rescheduled successfully. Waiting for doctor confirmation.',
            'reschedule_count' => $appointment->reschedule_count,
            'remaining_reschedules' => 3 - $appointment->reschedule_count
        ], 'Appointment rescheduled successfully');
        
    } catch (\Exception $e) {
        \Log::error('Reschedule error: ' . $e->getMessage());
        \Log::error('Error trace: ' . $e->getTraceAsString());
        return $this->error('Failed to reschedule appointment: ' . $e->getMessage(), 500);
    }
}



}
