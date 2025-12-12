<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run()
    {
        // Get all doctor users
        $doctorUsers = User::where('role', 'doctor')->get();

        $doctorData = [];
        $specializationCounter = 1;
        $doctorIndex = 0;

        foreach ($doctorUsers as $user) {
            // Assign specializations: 2 doctors per specialization
            $specializationId = floor($doctorIndex / 2) + 1;

            $doctorData[] = [
                'user_id' => $user->id,
                'specialization_id' => min($specializationId, 10), // Max 10 specializations
                'license_number' => 'MED' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                'experience_years' => rand(5, 20),
                'consultation_fee' => $this->getConsultationFee($specializationId),
                'biography' => $this->generateBiography($user->name, $specializationId),
                'rating' => round(rand(40, 50) / 10, 1), // 4.0 to 5.0
                'is_approved' => true,
            ];

            $doctorIndex++;
        }

        foreach ($doctorData as $data) {
            Doctor::create($data);
        }

        $this->command->info('Doctors seeded successfully!');
    }

    private function getConsultationFee($specializationId)
    {
        $fees = [
            1 => 300.00, // Cardiology
            2 => 250.00, // Dermatology
            3 => 350.00, // Neurology
            4 => 280.00, // Pediatrics
            5 => 320.00, // Orthopedics
            6 => 290.00, // Gynecology
            7 => 270.00, // Dentistry
            8 => 200.00, // Psychiatry
            9 => 250.00, // Ophthalmology
            10 => 150.00, // General Practice
        ];

        return $fees[$specializationId] ?? 200.00;
    }

    private function generateBiography($name, $specializationId)
    {
        $specializations = [
            1 => 'cardiology',
            2 => 'dermatology',
            3 => 'neurology',
            4 => 'pediatrics',
            5 => 'orthopedics',
            6 => 'gynecology',
            7 => 'dentistry',
            8 => 'psychiatry',
            9 => 'ophthalmology',
            10 => 'general practice',
        ];

        $specName = $specializations[$specializationId];
        return "Dr. {$name} is an experienced {$specName} specialist with extensive expertise in treating various conditions. With years of practical experience, Dr. {$name} provides comprehensive care and personalized treatment plans to ensure optimal patient outcomes.";
    }
}
