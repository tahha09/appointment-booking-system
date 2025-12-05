<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function run()
    {
        $patients = [
            [
                'email' => 'tasneem.m.g11@gmail.com',
                'emergency_contact' => '+201100000001',
                'insurance_provider' => 'Health Insurance Company',
                'insurance_policy_number' => 'INS123456',
                'insurance_info' => 'Health Insurance Company - Policy No: INS123456',
                'medical_history' => 'No significant medical history',
                'blood_type' => 'O+',
                'allergies' => 'None',
                'chronic_conditions' => 'None',
            ],
            [
                'email' => 'eslam@booking.com',
                'emergency_contact' => '+201100000002',
                'insurance_provider' => 'Medical Care Insurance',
                'insurance_policy_number' => 'INS789012',
                'insurance_info' => 'Medical Care Insurance - Policy No: INS789012',
                'medical_history' => 'Allergic to penicillin',
                'blood_type' => 'A+',
                'allergies' => 'Penicillin, Dust mites',
                'chronic_conditions' => 'Mild asthma',
            ],
            [
                'email' => 'mariam.ibrahim@booking.com',
                'emergency_contact' => '+201100000003',
                'insurance_provider' => 'National Health Insurance',
                'insurance_policy_number' => 'INS234567',
                'insurance_info' => 'National Health Insurance - Policy No: INS234567',
                'medical_history' => 'Previous appendectomy in 2018',
                'blood_type' => 'B+',
                'allergies' => 'Shellfish',
                'chronic_conditions' => 'None',
            ],
            [
                'email' => 'youssef.mahmoud@booking.com',
                'emergency_contact' => '+201100000004',
                'insurance_provider' => 'Premium Health Care',
                'insurance_policy_number' => 'INS345678',
                'insurance_info' => 'Premium Health Care - Policy No: INS345678',
                'medical_history' => 'Hypertension diagnosed in 2020',
                'blood_type' => 'AB+',
                'allergies' => 'None',
                'chronic_conditions' => 'Hypertension',
            ],
            [
                'email' => 'nour.eldin@booking.com',
                'emergency_contact' => '+201100000005',
                'insurance_provider' => 'Family Health Plan',
                'insurance_policy_number' => 'INS456789',
                'insurance_info' => 'Family Health Plan - Policy No: INS456789',
                'medical_history' => 'Type 2 Diabetes, managed with medication',
                'blood_type' => 'O-',
                'allergies' => 'Latex',
                'chronic_conditions' => 'Type 2 Diabetes',
            ],
            [
                'email' => 'fatma.mohamed@booking.com',
                'emergency_contact' => '+201100000006',
                'insurance_provider' => 'Comprehensive Care',
                'insurance_policy_number' => 'INS567890',
                'insurance_info' => 'Comprehensive Care - Policy No: INS567890',
                'medical_history' => 'Seasonal allergies, migraines',
                'blood_type' => 'A-',
                'allergies' => 'Pollen, Pet dander',
                'chronic_conditions' => 'Migraine headaches',
            ],
            [
                'email' => 'karim.abdelrahman@booking.com',
                'emergency_contact' => '+201100000007',
                'insurance_provider' => 'Health Shield',
                'insurance_policy_number' => 'INS678901',
                'insurance_info' => 'Health Shield - Policy No: INS678901',
                'medical_history' => 'Sports injury - knee surgery in 2019',
                'blood_type' => 'B-',
                'allergies' => 'Ibuprofen',
                'chronic_conditions' => 'None',
            ],
            [
                'email' => 'layla.ahmed@booking.com',
                'emergency_contact' => '+201100000008',
                'insurance_provider' => 'Wellness Plus',
                'insurance_policy_number' => 'INS789012',
                'insurance_info' => 'Wellness Plus - Policy No: INS789012',
                'medical_history' => 'Anemia, regular iron supplements',
                'blood_type' => 'O+',
                'allergies' => 'None',
                'chronic_conditions' => 'Iron deficiency anemia',
            ],
            [
                'email' => 'amr.mostafa@booking.com',
                'emergency_contact' => '+201100000009',
                'insurance_provider' => 'Prime Medical',
                'insurance_policy_number' => 'INS890123',
                'insurance_info' => 'Prime Medical - Policy No: INS890123',
                'medical_history' => 'High cholesterol, on statin medication',
                'blood_type' => 'A+',
                'allergies' => 'None',
                'chronic_conditions' => 'Hyperlipidemia',
            ],
            [
                'email' => 'dina.samir@booking.com',
                'emergency_contact' => '+201100000010',
                'insurance_provider' => 'Care First',
                'insurance_policy_number' => 'INS901234',
                'insurance_info' => 'Care First - Policy No: INS901234',
                'medical_history' => 'Thyroid condition, regular monitoring',
                'blood_type' => 'B+',
                'allergies' => 'Sulfa drugs',
                'chronic_conditions' => 'Hypothyroidism',
            ],
            [
                'email' => 'hassan.farouk@booking.com',
                'emergency_contact' => '+201100000011',
                'insurance_provider' => 'Health Guard',
                'insurance_policy_number' => 'INS012345',
                'insurance_info' => 'Health Guard - Policy No: INS012345',
                'medical_history' => 'No significant medical history',
                'blood_type' => 'AB-',
                'allergies' => 'None',
                'chronic_conditions' => 'None',
            ],
            [
                'email' => 'rana.tarek@booking.com',
                'emergency_contact' => '+201100000012',
                'insurance_provider' => 'Total Health',
                'insurance_policy_number' => 'INS123789',
                'insurance_info' => 'Total Health - Policy No: INS123789',
                'medical_history' => 'PCOS, managed with lifestyle and medication',
                'blood_type' => 'O+',
                'allergies' => 'None',
                'chronic_conditions' => 'Polycystic Ovary Syndrome (PCOS)',
            ],
        ];

        foreach ($patients as $patientData) {
            $user = User::where('email', $patientData['email'])->first();
            if ($user) {
                Patient::create([
                    'user_id' => $user->id,
                    'emergency_contact' => $patientData['emergency_contact'],
                    'insurance_provider' => $patientData['insurance_provider'],
                    'insurance_policy_number' => $patientData['insurance_policy_number'],
                    'insurance_info' => $patientData['insurance_info'],
                    'medical_history' => $patientData['medical_history'],
                    'blood_type' => $patientData['blood_type'],
                    'allergies' => $patientData['allergies'],
                    'chronic_conditions' => $patientData['chronic_conditions'],
                ]);
            }
        }
    }
}
