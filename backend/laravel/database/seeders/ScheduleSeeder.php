<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Schedule;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run()
    {
        $doctors = Doctor::all();

        foreach ($doctors as $index => $doctor) {
            // Different schedules for different doctors to make it realistic
            $schedules = [
                // Doctor 1: Sunday-Thursday, 9 AM - 5 PM
                [
                    ['day' => 1, 'start' => '09:00', 'end' => '17:00'], // Sunday
                    ['day' => 2, 'start' => '09:00', 'end' => '17:00'], // Monday
                    ['day' => 3, 'start' => '09:00', 'end' => '17:00'], // Tuesday
                    ['day' => 4, 'start' => '09:00', 'end' => '17:00'], // Wednesday
                    ['day' => 5, 'start' => '09:00', 'end' => '17:00'], // Thursday
                ],
                // Doctor 2: Sunday-Wednesday, 10 AM - 6 PM
                [
                    ['day' => 1, 'start' => '10:00', 'end' => '18:00'], // Sunday
                    ['day' => 2, 'start' => '10:00', 'end' => '18:00'], // Monday
                    ['day' => 3, 'start' => '10:00', 'end' => '18:00'], // Tuesday
                    ['day' => 4, 'start' => '10:00', 'end' => '18:00'], // Wednesday
                ],
                // Doctor 3: Monday-Friday, 8 AM - 4 PM
                [
                    ['day' => 2, 'start' => '08:00', 'end' => '16:00'], // Monday
                    ['day' => 3, 'start' => '08:00', 'end' => '16:00'], // Tuesday
                    ['day' => 4, 'start' => '08:00', 'end' => '16:00'], // Wednesday
                    ['day' => 5, 'start' => '08:00', 'end' => '16:00'], // Thursday
                    ['day' => 6, 'start' => '08:00', 'end' => '16:00'], // Friday
                ],
                // Doctor 4: Sunday-Tuesday, Thursday-Friday, 9 AM - 3 PM
                [
                    ['day' => 1, 'start' => '09:00', 'end' => '15:00'], // Sunday
                    ['day' => 2, 'start' => '09:00', 'end' => '15:00'], // Monday
                    ['day' => 3, 'start' => '09:00', 'end' => '15:00'], // Tuesday
                    ['day' => 5, 'start' => '09:00', 'end' => '15:00'], // Thursday
                    ['day' => 6, 'start' => '09:00', 'end' => '15:00'], // Friday
                ],
                // Doctor 5: Sunday-Thursday, 11 AM - 7 PM
                [
                    ['day' => 1, 'start' => '11:00', 'end' => '19:00'], // Sunday
                    ['day' => 2, 'start' => '11:00', 'end' => '19:00'], // Monday
                    ['day' => 3, 'start' => '11:00', 'end' => '19:00'], // Tuesday
                    ['day' => 4, 'start' => '11:00', 'end' => '19:00'], // Wednesday
                    ['day' => 5, 'start' => '11:00', 'end' => '19:00'], // Thursday
                ],
                // Doctor 6: Monday-Wednesday, Friday-Saturday, 9 AM - 5 PM
                [
                    ['day' => 2, 'start' => '09:00', 'end' => '17:00'], // Monday
                    ['day' => 3, 'start' => '09:00', 'end' => '17:00'], // Tuesday
                    ['day' => 4, 'start' => '09:00', 'end' => '17:00'], // Wednesday
                    ['day' => 6, 'start' => '09:00', 'end' => '17:00'], // Friday
                    ['day' => 0, 'start' => '09:00', 'end' => '17:00'], // Saturday
                ],
            ];

            // Use modulo to cycle through schedules if there are more doctors than schedules
            $scheduleIndex = $index % count($schedules);
            $doctorSchedule = $schedules[$scheduleIndex];

            foreach ($doctorSchedule as $schedule) {
                Schedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $schedule['day'],
                    'start_time' => $schedule['start'],
                    'end_time' => $schedule['end'],
                    'is_available' => true,
                ]);
            }
        }
    }
}
