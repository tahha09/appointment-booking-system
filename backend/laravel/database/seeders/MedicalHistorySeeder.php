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
        $patients = Patient::all();
        $doctors = Doctor::all();

        if ($patients->isEmpty() || $doctors->isEmpty()) {
            $this->command->warn('No patients or doctors found. Please run UserSeeder, DoctorSeeder, and PatientSeeder first.');
            return;
        }

        $medicalHistories = [
            // Patient 0 - Hypertension and related conditions
            [
                'patient_index' => 0,
                'doctor_index' => 0, // Cardiology
                'condition' => 'Hypertension',
                'diagnosis' => 'High Blood Pressure - Stage 1',
                'treatment' => 'Prescribed Lisinopril 10mg daily. Advised low-sodium diet and regular exercise.',
                'notes' => 'Patient reported occasional headaches. Blood pressure readings: 145/95 mmHg.',
                'visit_date' => now()->subMonths(2),
            ],
            [
                'patient_index' => 0,
                'doctor_index' => 0,
                'condition' => 'High Cholesterol',
                'diagnosis' => 'Hyperlipidemia',
                'treatment' => 'Atorvastatin 20mg daily. Dietary modifications recommended.',
                'notes' => 'Cholesterol levels elevated. Follow-up in 3 months.',
                'visit_date' => now()->subMonths(4),
            ],

            // Patient 1 - Allergies and skin conditions
            [
                'patient_index' => 1,
                'doctor_index' => 1, // Dermatology
                'condition' => 'Allergic Rhinitis',
                'diagnosis' => 'Seasonal Allergies',
                'treatment' => 'Cetirizine 10mg as needed. Nasal spray recommended.',
                'notes' => 'Symptoms worse in spring. Patient allergic to dust mites.',
                'visit_date' => now()->subMonths(3),
            ],
            [
                'patient_index' => 1,
                'doctor_index' => 1,
                'condition' => 'Mild Asthma',
                'diagnosis' => 'Asthma - Mild Persistent',
                'treatment' => 'Inhaler (Albuterol) as needed. Avoid triggers.',
                'notes' => 'Asthma well controlled. No recent attacks.',
                'visit_date' => now()->subMonths(6),
            ],

            // Patient 2 - Migraines
            [
                'patient_index' => 2,
                'doctor_index' => 2, // Neurology
                'condition' => 'Migraine Headaches',
                'diagnosis' => 'Chronic Migraine',
                'treatment' => 'Sumatriptan 50mg as needed. Preventive medication: Propranolol 40mg twice daily.',
                'notes' => 'Patient reports 4-6 migraines per month. Triggers: stress, lack of sleep.',
                'visit_date' => now()->subMonths(1),
            ],
            [
                'patient_index' => 2,
                'doctor_index' => 2,
                'condition' => 'Tension Headaches',
                'diagnosis' => 'Episodic Tension-Type Headache',
                'treatment' => 'Ibuprofen 400mg as needed. Stress management techniques.',
                'notes' => 'Less frequent than migraines. Related to work stress.',
                'visit_date' => now()->subMonths(8),
            ],

            // Patient 3 - General health
            [
                'patient_index' => 3,
                'doctor_index' => 3, // Pediatrics
                'condition' => 'Appendectomy',
                'diagnosis' => 'Acute Appendicitis',
                'treatment' => 'Surgical removal of appendix. Post-operative care.',
                'notes' => 'Surgery performed in 2018. Full recovery. No complications.',
                'visit_date' => now()->subYears(6),
            ],

            // Patient 4 - Diabetes and heart conditions
            [
                'patient_index' => 4,
                'doctor_index' => 0, // Cardiology
                'condition' => 'Type 2 Diabetes',
                'diagnosis' => 'Elevated blood sugar levels',
                'treatment' => 'Metformin 500mg twice daily. Regular exercise and diet modification recommended.',
                'notes' => 'HbA1c: 7.2%. Follow up in 3 months. Monitor blood glucose daily.',
                'visit_date' => now()->subMonths(5),
            ],
            [
                'patient_index' => 4,
                'doctor_index' => 0,
                'condition' => 'Hypertension',
                'diagnosis' => 'High Blood Pressure',
                'treatment' => 'Amlodipine 5mg daily. Regular monitoring.',
                'notes' => 'Blood pressure readings: 140/90 mmHg. Related to diabetes.',
                'visit_date' => now()->subMonths(3),
            ],

            // Patient 5 - Skin conditions
            [
                'patient_index' => 5,
                'doctor_index' => 1, // Dermatology
                'condition' => 'Acne Vulgaris',
                'diagnosis' => 'Moderate Acne',
                'treatment' => 'Topical retinoid cream. Benzoyl peroxide wash. Oral antibiotics if needed.',
                'notes' => 'Skin condition improving with treatment. Continue current regimen.',
                'visit_date' => now()->subMonths(2),
            ],
            [
                'patient_index' => 5,
                'doctor_index' => 4, // Orthopedics
                'condition' => 'Knee Injury',
                'diagnosis' => 'Sports-related knee injury',
                'treatment' => 'Physical therapy. Rest and ice. NSAIDs for pain.',
                'notes' => 'Knee surgery performed in 2019. Recovery progressing well.',
                'visit_date' => now()->subMonths(8),
            ],

            // Patient 6 - Anemia
            [
                'patient_index' => 6,
                'doctor_index' => 0, // General/Cardiology
                'condition' => 'Iron Deficiency Anemia',
                'diagnosis' => 'Low hemoglobin levels',
                'treatment' => 'Iron supplements (Ferrous sulfate 325mg daily). Vitamin C to enhance absorption.',
                'notes' => 'Hemoglobin: 10.5 g/dL. Regular iron supplements. Follow-up in 2 months.',
                'visit_date' => now()->subMonths(1),
            ],

            // Patient 7 - Thyroid
            [
                'patient_index' => 7,
                'doctor_index' => 5, // Gynecology
                'condition' => 'Hypothyroidism',
                'diagnosis' => 'Underactive thyroid',
                'treatment' => 'Levothyroxine 50mcg daily. Regular TSH monitoring.',
                'notes' => 'TSH levels: 5.8 mIU/L. Symptoms: fatigue, weight gain. Medication adjusted.',
                'visit_date' => now()->subMonths(4),
            ],

            // Patient 8 - High cholesterol
            [
                'patient_index' => 8,
                'doctor_index' => 0, // Cardiology
                'condition' => 'Hyperlipidemia',
                'diagnosis' => 'High Cholesterol',
                'treatment' => 'Rosuvastatin 10mg daily. Low-fat diet recommended.',
                'notes' => 'Total cholesterol: 240 mg/dL. LDL: 160 mg/dL. Follow-up in 3 months.',
                'visit_date' => now()->subMonths(2),
            ],

            // Patient 9 - PCOS
            [
                'patient_index' => 9,
                'doctor_index' => 5, // Gynecology
                'condition' => 'Polycystic Ovary Syndrome',
                'diagnosis' => 'PCOS',
                'treatment' => 'Metformin 500mg twice daily. Lifestyle modifications. Birth control pill.',
                'notes' => 'Irregular periods. Weight management and exercise recommended.',
                'visit_date' => now()->subMonths(3),
            ],
        ];

        foreach ($medicalHistories as $history) {
            $patient = $patients[$history['patient_index'] % $patients->count()];
            $doctor = $doctors[$history['doctor_index'] % $doctors->count()];

            MedicalHistory::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'condition' => $history['condition'],
                'diagnosis' => $history['diagnosis'],
                'treatment' => $history['treatment'],
                'notes' => $history['notes'],
                'visit_date' => $history['visit_date'],
            ]);
        }

        $this->command->info('Medical history records seeded successfully!');
    }
}
