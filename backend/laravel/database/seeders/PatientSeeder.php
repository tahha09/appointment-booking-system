<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function run()
    {
        $patients = User::where('role', 'patient')->get();
        $bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        $insuranceProviders = ['Health Insurance Co', 'Medicare Plus', 'Care Network', 'Prime Health', 'Wellness Alliance', 'Global Health'];

        foreach ($patients as $user) {
            $bloodType = $bloodTypes[array_rand($bloodTypes)];
            $insuranceProvider = $insuranceProviders[array_rand($insuranceProviders)];

            Patient::create([
                'user_id' => $user->id,
                'emergency_contact' => '+2011' . str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT),
                'insurance_provider' => $insuranceProvider,
                'insurance_policy_number' => 'INS' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                'insurance_info' => $insuranceProvider . ' - Policy No: INS' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                'medical_history' => $this->generateMedicalHistory(),
                'blood_type' => $bloodType,
                'allergies' => $this->generateAllergies(),
                'chronic_conditions' => $this->generateChronicConditions(),
            ]);
        }

        $this->command->info('Patients seeded successfully!');
    }

    private function generateMedicalHistory()
    {
        $histories = [
            'No significant medical history',
            'Allergic to penicillin',
            'Previous appendectomy in 2018',
            'Hypertension diagnosed in 2020',
            'Type 2 Diabetes, managed with medication',
            'Seasonal allergies, migraines',
            'Sports injury - knee surgery in 2019',
            'Anemia, regular iron supplements',
            'High cholesterol, on statin medication',
            'Thyroid condition, regular monitoring',
        ];
        return $histories[array_rand($histories)];
    }

    private function generateAllergies()
    {
        $allergies = [
            'None',
            'Penicillin, Dust mites',
            'Shellfish',
            'Pollen, Pet dander',
            'Ibuprofen',
            'Latex',
            'Sulfa drugs',
            'Codeine',
        ];
        return $allergies[array_rand($allergies)];
    }

    private function generateChronicConditions()
    {
        $conditions = [
            'None',
            'Hypertension',
            'Type 2 Diabetes',
            'Migraine headaches',
            'Iron deficiency anemia',
            'Hyperlipidemia',
            'Hypothyroidism',
            'Mild asthma',
            'Seasonal allergies',
        ];
        return $conditions[array_rand($conditions)];
    }
}
