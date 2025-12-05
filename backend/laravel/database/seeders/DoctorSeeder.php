<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run()
    {
        $doctors = [
            [
                'email' => 'ahmed185taha@Gmail.com',
                'specialization_id' => 1, // Cardiology
                'license_number' => 'MED123456',
                'experience_years' => 10,
                'consultation_fee' => 300.00,
                'biography' => 'Dr. Ahmed Taha is a renowned cardiologist with 10 years of experience in treating cardiovascular diseases. He specializes in preventive cardiology and interventional procedures.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'doctor2@booking.com',
                'specialization_id' => 2, // Dermatology
                'license_number' => 'MED789012',
                'experience_years' => 7,
                'consultation_fee' => 250.00,
                'biography' => 'Dr. Aya Basheer specializes in dermatology and skin treatments. She has extensive experience in treating acne, eczema, and cosmetic dermatology procedures.',
                'rating' => 4.6,
                'is_approved' => true,
            ],
            [
                'email' => 'tasneemgaballah11@gmail.com',
                'specialization_id' => 3, // Neurology
                'license_number' => 'MED345678',
                'experience_years' => 8,
                'consultation_fee' => 350.00,
                'biography' => 'Dr. Tasneem Gaballah is a skilled neurologist with expertise in treating neurological disorders, headaches, and epilepsy. She is known for her compassionate approach to patient care.',
                'rating' => 4.9,
                'is_approved' => true,
            ],
            [
                'email' => 'islam.ghanem@booking.com',
                'specialization_id' => 7, // Dentistry
                'license_number' => 'MED234567',
                'experience_years' => 9,
                'consultation_fee' => 270.00,
                'biography' => 'Dr. Islam Ghanem is an experienced dentist specializing in general dentistry, cosmetic procedures, and oral surgery. He is committed to providing quality dental care with a focus on patient comfort.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'mohamed.hassan@booking.com',
                'specialization_id' => 4, // Pediatrics
                'license_number' => 'MED456789',
                'experience_years' => 12,
                'consultation_fee' => 280.00,
                'biography' => 'Dr. Mohamed Hassan is an experienced pediatrician dedicated to children\'s health. He specializes in child development, vaccinations, and common childhood illnesses.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'sara.ali@booking.com',
                'specialization_id' => 5, // Orthopedics
                'license_number' => 'MED567890',
                'experience_years' => 9,
                'consultation_fee' => 320.00,
                'biography' => 'Dr. Sara Ali is a board-certified orthopedic surgeon specializing in sports medicine and joint replacement. She helps patients recover from injuries and improve mobility.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'omar.khaled@booking.com',
                'specialization_id' => 6, // Gynecology
                'license_number' => 'MED678901',
                'experience_years' => 11,
                'consultation_fee' => 290.00,
                'biography' => 'Dr. Omar Khaled is a respected gynecologist with expertise in women\'s reproductive health, prenatal care, and minimally invasive surgical procedures.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
        ];

        foreach ($doctors as $doctorData) {
            $user = User::where('email', $doctorData['email'])->first();
            if ($user) {
                Doctor::create([
                    'user_id' => $user->id,
                    'specialization_id' => $doctorData['specialization_id'],
                    'license_number' => $doctorData['license_number'],
                    'experience_years' => $doctorData['experience_years'],
                    'consultation_fee' => $doctorData['consultation_fee'],
                    'biography' => $doctorData['biography'],
                    'rating' => $doctorData['rating'],
                    'is_approved' => $doctorData['is_approved'],
                ]);
            }
        }
    }
}
