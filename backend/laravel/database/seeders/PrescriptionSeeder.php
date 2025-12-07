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

            // Additional prescriptions for expanded dataset
            // Patient 10 - Anxiety medication
            [
                'patient_index' => 10,
                'doctor_index' => 7, // Psychiatry
                'medication_name' => 'Sertraline',
                'dosage' => '50mg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take in the morning with food. May take 2-4 weeks to notice improvement.',
                'notes' => 'For generalized anxiety disorder. Monitor for side effects.',
                'prescribed_date' => now()->subMonths(4),
                'status' => 'active',
            ],

            // Patient 11 - Back pain medication
            [
                'patient_index' => 11,
                'doctor_index' => 4, // Orthopedics
                'medication_name' => 'Ibuprofen',
                'dosage' => '400mg',
                'frequency' => 'Three times daily',
                'duration' => '14 days',
                'instructions' => 'Take with food. Do not exceed recommended dose.',
                'notes' => 'For lower back pain. Physical therapy recommended.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],

            // Patient 12 - Depression medication
            [
                'patient_index' => 12,
                'doctor_index' => 7, // Psychiatry
                'medication_name' => 'Fluoxetine',
                'dosage' => '20mg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take in the morning. Full effect may take 4-6 weeks.',
                'notes' => 'For major depressive disorder. Regular follow-up required.',
                'prescribed_date' => now()->subMonths(6),
                'status' => 'active',
            ],

            // Patient 13 - Arthritis medication
            [
                'patient_index' => 13,
                'doctor_index' => 4, // Orthopedics
                'medication_name' => 'Methotrexate',
                'dosage' => '15mg',
                'frequency' => 'Once weekly',
                'duration' => '90 days',
                'instructions' => 'Take on the same day each week. Blood tests required for monitoring.',
                'notes' => 'Disease-modifying agent for rheumatoid arthritis. Liver function monitoring required.',
                'prescribed_date' => now()->subMonths(3),
                'status' => 'active',
            ],

            // Patient 14 - Eye medication
            [
                'patient_index' => 14,
                'doctor_index' => 8, // Ophthalmology
                'medication_name' => 'Latanoprost Eye Drops',
                'dosage' => '0.005%',
                'frequency' => 'Once daily at bedtime',
                'duration' => '30 days',
                'instructions' => 'Apply one drop to affected eye(s). Keep refrigerated.',
                'notes' => 'For glaucoma management. Regular eye pressure checks required.',
                'prescribed_date' => now()->subMonths(1),
                'status' => 'active',
            ],

            // Patient 15 - GERD medication
            [
                'patient_index' => 15,
                'doctor_index' => 9, // General Practice
                'medication_name' => 'Omeprazole',
                'dosage' => '20mg',
                'frequency' => 'Once daily',
                'duration' => '60 days',
                'instructions' => 'Take before breakfast. May take up to 4 weeks for full effect.',
                'notes' => 'Proton pump inhibitor for GERD. Lifestyle modifications recommended.',
                'prescribed_date' => now()->subMonths(5),
                'status' => 'active',
            ],

            // Patient 16 - Osteoporosis supplements
            [
                'patient_index' => 16,
                'doctor_index' => 4, // Orthopedics
                'medication_name' => 'Calcium Carbonate + Vitamin D',
                'dosage' => '500mg/200IU',
                'frequency' => 'Twice daily',
                'duration' => '180 days',
                'instructions' => 'Take with meals. Adequate calcium intake essential.',
                'notes' => 'Calcium and vitamin D supplementation for osteoporosis prevention.',
                'prescribed_date' => now()->subMonths(7),
                'status' => 'active',
            ],

            // Patient 17 - COPD medication
            [
                'patient_index' => 17,
                'doctor_index' => 0, // Cardiology (respiratory)
                'medication_name' => 'Salbutamol Inhaler',
                'dosage' => '100mcg',
                'frequency' => 'As needed',
                'duration' => '60 days',
                'instructions' => 'Use 1-2 puffs when breathless. Maximum 8 puffs per day.',
                'notes' => 'Short-acting bronchodilator for COPD symptom relief.',
                'prescribed_date' => now()->subMonths(4),
                'status' => 'active',
            ],

            // Patient 18 - Endometriosis medication
            [
                'patient_index' => 18,
                'doctor_index' => 5, // Gynecology
                'medication_name' => 'Naproxen',
                'dosage' => '500mg',
                'frequency' => 'As needed',
                'duration' => '30 days',
                'instructions' => 'Take with food for menstrual pain. Maximum 2 tablets per day.',
                'notes' => 'NSAID for endometriosis-related pain management.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],

            // Patient 21 - Sleep apnea equipment
            [
                'patient_index' => 21,
                'doctor_index' => 2, // Neurology
                'medication_name' => 'CPAP Machine',
                'dosage' => 'Auto-adjusting',
                'frequency' => 'Every night',
                'duration' => 'Ongoing',
                'instructions' => 'Use every night during sleep. Clean mask and tubing daily.',
                'notes' => 'Continuous positive airway pressure for obstructive sleep apnea.',
                'prescribed_date' => now()->subMonths(2),
                'status' => 'active',
            ],

            // Patient 22 - Atrial fibrillation medication
            [
                'patient_index' => 22,
                'doctor_index' => 0, // Cardiology
                'medication_name' => 'Warfarin',
                'dosage' => '5mg',
                'frequency' => 'Once daily',
                'duration' => '90 days',
                'instructions' => 'Take at the same time each day. Regular INR monitoring required.',
                'notes' => 'Anticoagulant for atrial fibrillation stroke prevention.',
                'prescribed_date' => now()->subMonths(1),
                'status' => 'active',
            ],

            // Patient 23 - Psoriasis treatment
            [
                'patient_index' => 23,
                'doctor_index' => 1, // Dermatology
                'medication_name' => 'Calcipotriene Cream',
                'dosage' => '0.005%',
                'frequency' => 'Twice daily',
                'duration' => '60 days',
                'instructions' => 'Apply thin layer to affected areas. Avoid sun exposure.',
                'notes' => 'Vitamin D analog for plaque psoriasis treatment.',
                'prescribed_date' => now()->subMonths(3),
                'status' => 'active',
            ],

            // Patient 24 - Epilepsy medication
            [
                'patient_index' => 24,
                'doctor_index' => 2, // Neurology
                'medication_name' => 'Levetiracetam',
                'dosage' => '1000mg',
                'frequency' => 'Twice daily',
                'duration' => '90 days',
                'instructions' => 'Take with or without food. Do not stop abruptly.',
                'notes' => 'Antiepileptic medication for temporal lobe epilepsy.',
                'prescribed_date' => now()->subMonths(5),
                'status' => 'active',
            ],

            // Patient 25 - Hepatitis C treatment
            [
                'patient_index' => 25,
                'doctor_index' => 9, // General Practice
                'medication_name' => 'Sofosbuvir/Velpatasvir',
                'dosage' => '400mg/100mg',
                'frequency' => 'Once daily',
                'duration' => '84 days',
                'instructions' => 'Take with food. Complete the full 12-week course.',
                'notes' => 'Direct-acting antiviral therapy for chronic hepatitis C.',
                'prescribed_date' => now()->subMonths(1),
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
            [
                'patient_index' => 5,
                'doctor_index' => 1,
                'medication_name' => 'Doxycycline',
                'dosage' => '100mg',
                'frequency' => 'Twice daily',
                'duration' => '7 days',
                'instructions' => 'Take with plenty of water. Avoid dairy products.',
                'notes' => 'Antibiotic for skin infection. Course completed.',
                'prescribed_date' => now()->subMonths(3),
                'status' => 'completed',
            ],
            [
                'patient_index' => 7,
                'doctor_index' => 5,
                'medication_name' => 'Medroxyprogesterone',
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => '10 days',
                'instructions' => 'Take for 10 days to induce withdrawal bleeding.',
                'notes' => 'Progestin for abnormal uterine bleeding. Completed.',
                'prescribed_date' => now()->subMonths(2),
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





