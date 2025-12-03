<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Prescription;
use App\Models\Appointment;

class PrescriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patients = Patient::all();
        $doctors = Doctor::all();
        $appointments = Appointment::where('status', 'completed')->get();

        if ($patients->isEmpty() || $doctors->isEmpty()) {
            $this->command->warn('No patients or doctors found. Please run UserSeeder, DoctorSeeder, and PatientSeeder first.');
            return;
        }

        $prescriptions = [
            // Patient 0 - Hypertension medications
            [
                'patient_index' => 0,
                'doctor_index' => 0,
                'medication_name' => 'Lisinopril',
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => '30 days',
                'instructions' => 'Take with food in the morning. Monitor blood pressure regularly.',
                'notes' => 'Prescribed for hypertension management. Continue as directed.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],
            [
                'patient_index' => 0,
                'doctor_index' => 0,
                'medication_name' => 'Atorvastatin',
                'dosage' => '20mg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take at bedtime. May cause muscle pain - report if severe.',
                'notes' => 'For high cholesterol. Follow-up in 3 months.',
                'prescribed_date' => now()->subMonths(4),
                'status' => 'active',
            ],

            // Patient 1 - Allergy medications
            [
                'patient_index' => 1,
                'doctor_index' => 1,
                'medication_name' => 'Cetirizine',
                'dosage' => '10mg',
                'frequency' => 'As needed',
                'duration' => '30 days',
                'instructions' => 'Take one tablet when allergy symptoms occur. Maximum one per day.',
                'notes' => 'For seasonal allergies and allergic rhinitis. More effective in spring.',
                'prescribed_date' => now()->subMonths(3),
                'status' => 'active',
            ],
            [
                'patient_index' => 1,
                'doctor_index' => 1,
                'medication_name' => 'Albuterol Inhaler',
                'dosage' => '90mcg',
                'frequency' => 'As needed',
                'duration' => '60 days',
                'instructions' => 'Use 1-2 puffs when experiencing shortness of breath or asthma symptoms.',
                'notes' => 'Rescue inhaler for asthma. Keep with you at all times.',
                'prescribed_date' => now()->subMonths(6),
                'status' => 'active',
            ],

            // Patient 2 - Migraine medications
            [
                'patient_index' => 2,
                'doctor_index' => 2,
                'medication_name' => 'Sumatriptan',
                'dosage' => '50mg',
                'frequency' => 'As needed',
                'duration' => '30 days',
                'instructions' => 'Take at first sign of migraine. Maximum 2 tablets per day.',
                'notes' => 'For acute migraine treatment. Do not exceed recommended dose.',
                'prescribed_date' => now()->subMonths(1),
                'status' => 'active',
            ],
            [
                'patient_index' => 2,
                'doctor_index' => 2,
                'medication_name' => 'Propranolol',
                'dosage' => '40mg',
                'frequency' => 'Twice daily',
                'duration' => '90 days',
                'instructions' => 'Take with meals. Do not stop suddenly - taper gradually.',
                'notes' => 'Preventive medication for migraines. Monitor heart rate.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],
            [
                'patient_index' => 2,
                'doctor_index' => 2,
                'medication_name' => 'Ibuprofen',
                'dosage' => '400mg',
                'frequency' => 'As needed',
                'duration' => '30 days',
                'instructions' => 'Take with food. Maximum 3 times per day for tension headaches.',
                'notes' => 'For tension headaches. Avoid if allergic to NSAIDs.',
                'prescribed_date' => now()->subMonths(8),
                'status' => 'completed',
            ],

            // Patient 4 - Diabetes medications
            [
                'patient_index' => 4,
                'doctor_index' => 0,
                'medication_name' => 'Metformin',
                'dosage' => '500mg',
                'frequency' => 'Twice daily',
                'duration' => '90 days',
                'instructions' => 'Take with meals. Start with one tablet per day for first week, then increase.',
                'notes' => 'For Type 2 Diabetes management. Monitor blood glucose daily. Follow up in 3 months.',
                'prescribed_date' => now()->subMonths(5),
                'status' => 'active',
            ],
            [
                'patient_index' => 4,
                'doctor_index' => 0,
                'medication_name' => 'Amlodipine',
                'dosage' => '5mg',
                'frequency' => 'Once daily',
                'duration' => '30 days',
                'instructions' => 'Take at the same time each day. May cause ankle swelling.',
                'notes' => 'For hypertension. Related to diabetes management.',
                'prescribed_date' => now()->subMonths(3),
                'status' => 'active',
            ],

            // Patient 5 - Acne treatment
            [
                'patient_index' => 5,
                'doctor_index' => 1,
                'medication_name' => 'Tretinoin Cream',
                'dosage' => '0.05%',
                'frequency' => 'Once daily at bedtime',
                'duration' => '60 days',
                'instructions' => 'Apply thin layer to affected areas. Avoid sun exposure. Use sunscreen.',
                'notes' => 'Topical retinoid for acne treatment. May cause initial dryness.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],
            [
                'patient_index' => 5,
                'doctor_index' => 1,
                'medication_name' => 'Benzoyl Peroxide Wash',
                'dosage' => '5%',
                'frequency' => 'Twice daily',
                'duration' => '60 days',
                'instructions' => 'Wash face morning and evening. May bleach fabrics.',
                'notes' => 'Antibacterial wash for acne. Continue with retinoid cream.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],

            // Patient 6 - Anemia treatment
            [
                'patient_index' => 6,
                'doctor_index' => 0,
                'medication_name' => 'Ferrous Sulfate',
                'dosage' => '325mg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take on empty stomach with vitamin C. May cause constipation.',
                'notes' => 'Iron supplement for anemia. Follow-up in 2 months to check hemoglobin.',
                'prescribed_date' => now()->subMonths(1),
                'status' => 'active',
            ],

            // Patient 7 - Thyroid medication
            [
                'patient_index' => 7,
                'doctor_index' => 5,
                'medication_name' => 'Levothyroxine',
                'dosage' => '50mcg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take on empty stomach, 30 minutes before breakfast. Do not take with calcium or iron.',
                'notes' => 'For hypothyroidism. Regular TSH monitoring required. Follow-up in 3 months.',
                'prescribed_date' => now()->subMonths(4),
                'status' => 'active',
            ],

            // Patient 8 - Cholesterol medication
            [
                'patient_index' => 8,
                'doctor_index' => 0,
                'medication_name' => 'Rosuvastatin',
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take at bedtime. May cause muscle pain - report if severe.',
                'notes' => 'For high cholesterol. Follow-up in 3 months to check lipid levels.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],

            // Patient 9 - PCOS medication
            [
                'patient_index' => 9,
                'doctor_index' => 5,
                'medication_name' => 'Metformin',
                'dosage' => '500mg',
                'frequency' => 'Twice daily',
                'duration' => '90 days',
                'instructions' => 'Take with meals. Helps with insulin resistance and weight management.',
                'notes' => 'For PCOS management. Combined with lifestyle modifications.',
                'prescribed_date' => now()->subMonths(3),
                'status' => 'active',
            ],

            // Completed prescriptions (antibiotics, short-term)
            [
                'patient_index' => 0,
                'doctor_index' => 0,
                'medication_name' => 'Amoxicillin',
                'dosage' => '500mg',
                'frequency' => 'Three times daily',
                'duration' => '7 days',
                'instructions' => 'Take with food. Complete the full course even if symptoms improve.',
                'notes' => 'Antibiotic course for bacterial infection. Completed successfully.',
                'prescribed_date' => now()->subMonths(1),
                'status' => 'completed',
            ],
            [
                'patient_index' => 3,
                'doctor_index' => 3,
                'medication_name' => 'Paracetamol',
                'dosage' => '500mg',
                'frequency' => 'As needed',
                'duration' => '14 days',
                'instructions' => 'Take for pain or fever. Maximum 4 times per day.',
                'notes' => 'Post-operative pain management. Completed.',
                'prescribed_date' => now()->subYears(6),
                'status' => 'completed',
            ],
        ];

        foreach ($prescriptions as $prescriptionData) {
            $patient = $patients[$prescriptionData['patient_index'] % $patients->count()];
            $doctor = $doctors[$prescriptionData['doctor_index'] % $doctors->count()];

            // Try to find a related appointment, otherwise use null
            $appointment = $appointments->where('patient_id', $patient->id)
                ->where('doctor_id', $doctor->id)
                ->first();

            Prescription::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_id' => $appointment ? $appointment->id : null,
                'medication_name' => $prescriptionData['medication_name'],
                'dosage' => $prescriptionData['dosage'],
                'frequency' => $prescriptionData['frequency'],
                'duration' => $prescriptionData['duration'],
                'instructions' => $prescriptionData['instructions'],
                'notes' => $prescriptionData['notes'],
                'prescribed_date' => $prescriptionData['prescribed_date'],
                'status' => $prescriptionData['status'],
            ]);
        }

        $this->command->info('Prescriptions seeded successfully!');
    }
}

