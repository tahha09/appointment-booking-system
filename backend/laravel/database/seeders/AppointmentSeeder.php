<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    public function run()
    {
        $doctor = Doctor::first();
        $patient = Patient::first();

        // Create sample appointments
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDays(2)->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '10:30',
            'status' => 'confirmed',
            'reason' => 'Regular heart checkup',
        ]);

        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->addDays(5)->format('Y-m-d'),
            'start_time' => '14:00',
            'end_time' => '14:30',
            'status' => 'pending',
            'reason' => 'Follow-up appointment',
        ]);
    }
}
