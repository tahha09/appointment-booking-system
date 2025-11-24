<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run()
    {
        $doctor1 = User::where('email', 'doctor1@booking.com')->first();
        $doctor2 = User::where('email', 'doctor2@booking.com')->first();

        Doctor::create([
            'user_id' => $doctor1->id,
            'specialization_id' => 1, // Cardiology
            'license_number' => 'MED123456',
            'experience_years' => 10,
            'consultation_fee' => 300.00,
            'biography' => 'Dr. Ahmed is a renowned cardiologist with 10 years of experience...',
            'rating' => 4.8,
            'is_approved' => true,
        ]);

        Doctor::create([
            'user_id' => $doctor2->id,
            'specialization_id' => 2, // Dermatology
            'license_number' => 'MED789012',
            'experience_years' => 7,
            'consultation_fee' => 250.00,
            'biography' => 'Dr. Aya specializes in dermatology and skin treatments...',
            'rating' => 4.6,
            'is_approved' => true,
        ]);
    }
}
