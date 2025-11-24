<?php

namespace App\Traits;

use App\Models\Appointment;

trait HandlesAppointment
{
    protected function validateAppointmentTime($doctorId, $date, $time)
    {
        return !Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('start_time', $time)
            ->whereIn('status', ['confirmed', 'pending'])
            ->exists();
    }

    protected function calculateEndTime($startTime, $duration = 30)
    {
        return date('H:i', strtotime("+{$duration} minutes", strtotime($startTime)));
    }

    protected function isAppointmentCancellable($appointment)
    {
        $appointmentDateTime = strtotime($appointment->appointment_date . ' ' . $appointment->start_time);
        $currentDateTime = time();
        $hoursDifference = ($appointmentDateTime - $currentDateTime) / 3600;

        return $hoursDifference > 24; // Can cancel if more than 24 hours before
    }

    protected function getAppointmentStatusColor($status)
    {
        $colors = [
            'pending' => 'warning',
            'confirmed' => 'success',
            'cancelled' => 'danger',
            'completed' => 'info'
        ];

        return $colors[$status] ?? 'secondary';
    }
}
