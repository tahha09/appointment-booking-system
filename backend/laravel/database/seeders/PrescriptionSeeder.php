<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Prescription;

class PrescriptionSeeder extends Seeder
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
        echo "Creating prescription records...\n";

        Prescription::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'medication_name' => 'Lisinopril',
            'dosage' => '10mg',
            'frequency' => 'Once daily',
            'duration' => '30 days',
            'instructions' => 'Take with food. Monitor blood pressure regularly.',
            'notes' => 'Prescribed for hypertension management.',
            'prescribed_date' => now()->subMonths(2),
            'status' => 'active',
        ]);

        Prescription::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'medication_name' => 'Metformin',
            'dosage' => '500mg',
            'frequency' => 'Twice daily',
            'duration' => '90 days',
            'instructions' => 'Take with meals. Start with one tablet per day for first week.',
            'notes' => 'For Type 2 Diabetes management. Follow up in 3 months.',
            'prescribed_date' => now()->subMonths(5),
            'status' => 'active',
        ]);

        Prescription::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'medication_name' => 'Cetirizine',
            'dosage' => '10mg',
            'frequency' => 'As needed',
            'duration' => '30 days',
            'instructions' => 'Take one tablet when allergy symptoms occur. Maximum one per day.',
            'notes' => 'For seasonal allergies. More effective in spring.',
            'prescribed_date' => now()->subYear(),
            'status' => 'completed',
        ]);

        Prescription::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'medication_name' => 'Amoxicillin',
            'dosage' => '500mg',
            'frequency' => 'Three times daily',
            'duration' => '7 days',
            'instructions' => 'Take with food. Complete the full course even if symptoms improve.',
            'notes' => 'Antibiotic course for bacterial infection.',
            'prescribed_date' => now()->subMonths(1),
            'status' => 'completed',
        ]);

        echo "Successfully created 4 prescription records!\n";
    }
}


