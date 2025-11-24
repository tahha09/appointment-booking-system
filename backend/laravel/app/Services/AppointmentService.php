<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Schedule;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    public function bookAppointment($patientId, $doctorId, $date, $time, $reason = null)
    {
        return DB::transaction(function () use ($patientId, $doctorId, $date, $time, $reason) {
            // Check if doctor exists and is approved
            $doctor = Doctor::where('id', $doctorId)->where('is_approved', true)->first();
            if (!$doctor) {
                throw new \Exception('Doctor not found or not approved');
            }

            // Check if patient exists
            $patient = Patient::find($patientId);
            if (!$patient) {
                throw new \Exception('Patient not found');
            }

            // Check if time slot is available
            $isAvailable = $this->checkTimeSlotAvailability($doctorId, $date, $time);
            if (!$isAvailable) {
                throw new \Exception('Time slot is not available');
            }

            // Calculate end time (30 minutes appointment)
            $endTime = date('H:i', strtotime("+30 minutes", strtotime($time)));

            // Create appointment
            $appointment = Appointment::create([
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'appointment_date' => $date,
                'start_time' => $time,
                'end_time' => $endTime,
                'status' => 'pending',
                'reason' => $reason,
            ]);

            // Create notification for doctor
            Notification::create([
                'user_id' => $doctor->user_id,
                'title' => 'New Appointment Request',
                'message' => "You have a new appointment request from {$patient->user->name}",
                'type' => 'info',
                'related_appointment_id' => $appointment->id,
            ]);

            return $appointment;
        });
    }

    public function checkTimeSlotAvailability($doctorId, $date, $time)
    {
        // Check if there's any conflicting appointment
        $conflictingAppointment = Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('start_time', $time)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($conflictingAppointment) {
            return false;
        }

        // Check if doctor has schedule for this day and time
        $dayOfWeek = date('w', strtotime($date)); // 0 = Sunday, 6 = Saturday
        $schedule = Schedule::where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->exists();

        return $schedule;
    }

    public function getAvailableSlots($doctorId, $date)
    {
        $dayOfWeek = date('w', strtotime($date));
        $schedules = Schedule::where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->get();

        $availableSlots = [];
        $bookedSlots = Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->pluck('start_time')
            ->toArray();

        foreach ($schedules as $schedule) {
            $currentTime = strtotime($schedule->start_time);
            $endTime = strtotime($schedule->end_time);

            while ($currentTime < $endTime) {
                $slot = date('H:i', $currentTime);
                if (!in_array($slot, $bookedSlots)) {
                    $availableSlots[] = $slot;
                }
                $currentTime = strtotime('+30 minutes', $currentTime);
            }
        }

        return $availableSlots;
    }

    public function updateAppointmentStatus($appointmentId, $status)
    {
        $appointment = Appointment::findOrFail($appointmentId);
        $appointment->status = $status;
        $appointment->save();

        // Create notification for patient
        Notification::create([
            'user_id' => $appointment->patient->user_id,
            'title' => 'Appointment Status Updated',
            'message' => "Your appointment status has been updated to: {$status}",
            'type' => 'info',
            'related_appointment_id' => $appointment->id,
        ]);

        return $appointment;
    }
}
