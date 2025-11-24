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

        foreach ($doctors as $doctor) {
            // Working hours: Sunday to Thursday (1-5), 9 AM to 5 PM
            for ($day = 1; $day <= 5; $day++) {
                Schedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'is_available' => true,
                ]);
            }
        }
    }
}
