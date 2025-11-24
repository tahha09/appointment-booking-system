<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function run()
    {
        $patient1 = User::where('email', 'patient@booking.com')->first();
        $patient2 = User::where('email', 'eslam@booking.com')->first();

        Patient::create([
            'user_id' => $patient1->id,
            'emergency_contact' => '+201100000001',
            'insurance_info' => 'Health Insurance Company - Policy No: INS123456',
            'medical_history' => 'No significant medical history',
        ]);

        Patient::create([
            'user_id' => $patient2->id,
            'emergency_contact' => '+201100000002',
            'insurance_info' => 'Medical Care Insurance - Policy No: INS789012',
            'medical_history' => 'Allergic to penicillin',
        ]);
    }
}
