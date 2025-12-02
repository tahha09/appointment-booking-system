<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\MedicalHistory;

class MedicalHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patient = Patient::where('user_id', 5)->first();
        $doctor = Doctor::first();

        echo "Looking for patient with user_id 5...\n";
        if (!$patient) {
            echo "ERROR: No patient found with user_id 5\n";
            echo "Available patients: \n";
            Patient::all()->each(function($p) {
                echo "  - Patient ID: {$p->id}, User ID: {$p->user_id}\n";
            });
            return;
        }

        if (!$doctor) {
            echo "ERROR: No doctors found in database\n";
            return;
        }

        echo "Found patient ID: {$patient->id}, doctor ID: {$doctor->id}\n";
        echo "Creating medical history records...\n";

        MedicalHistory::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'condition' => 'Hypertension',
            'diagnosis' => 'High Blood Pressure',
            'treatment' => 'Prescribed Lisinopril 10mg daily. Advised low-sodium diet.',
            'notes' => 'Patient reported occasional headaches.',
            'visit_date' => now()->subMonths(2),
        ]);

        MedicalHistory::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'condition' => 'Type 2 Diabetes',
            'diagnosis' => 'Elevated blood sugar levels',
            'treatment' => 'Metformin 500mg twice daily. Regular exercise recommended.',
            'notes' => 'Follow up in 3 months.',
            'visit_date' => now()->subMonths(5),
        ]);
        
        MedicalHistory::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'condition' => 'Seasonal Allergies',
            'diagnosis' => 'Allergic Rhinitis',
            'treatment' => 'Cetirizine 10mg as needed.',
            'notes' => 'Worse in spring.',
            'visit_date' => now()->subYear(),
        ]);

        echo "Successfully created 3 medical history records!\n";
    }
}
