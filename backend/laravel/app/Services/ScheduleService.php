<?php

namespace App\Services;

use App\Models\Schedule;
use App\Models\Holiday;
use App\Models\Doctor;

class ScheduleService
{
    public function setWeeklySchedule($doctorId, $scheduleData)
    {
        // Delete existing schedule for this doctor
        Schedule::where('doctor_id', $doctorId)->delete();

        foreach ($scheduleData as $daySchedule) {
            Schedule::create([
                'doctor_id' => $doctorId,
                'day_of_week' => $daySchedule['day_of_week'],
                'start_time' => $daySchedule['start_time'],
                'end_time' => $daySchedule['end_time'],
                'is_available' => $daySchedule['is_available'] ?? true,
            ]);
        }

        return Schedule::where('doctor_id', $doctorId)->get();
    }

    public function addHoliday($doctorId, $date, $reason)
    {
        return Holiday::create([
            'doctor_id' => $doctorId,
            'holiday_date' => $date,
            'reason' => $reason,
        ]);
    }

    public function isDoctorAvailable($doctorId, $date, $time)
    {
        // Check if it's a holiday
        $isHoliday = Holiday::where('doctor_id', $doctorId)
            ->where('holiday_date', $date)
            ->exists();

        if ($isHoliday) {
            return false;
        }

        // Check schedule
        $dayOfWeek = date('w', strtotime($date));
        $schedule = Schedule::where('doctor_id', $doctorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_available', true)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->exists();

        return $schedule;
    }

    public function getDoctorSchedule($doctorId)
    {
        return Schedule::where('doctor_id', $doctorId)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();
    }
}
