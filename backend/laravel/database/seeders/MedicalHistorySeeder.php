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

            // Additional Medical Histories for expanded dataset
            // Patient 10 - Anxiety
            [
                'patient_index' => 10,
                'doctor_index' => 7, // Psychiatry
                'condition' => 'Generalized Anxiety Disorder',
                'diagnosis' => 'Moderate anxiety with panic attacks',
                'treatment' => 'Sertraline 50mg daily. Cognitive behavioral therapy recommended.',
                'notes' => 'Patient experiencing frequent panic attacks. Progressing well with treatment.',
                'visit_date' => now()->subMonths(4),
            ],

            // Patient 11 - Back pain
            [
                'patient_index' => 11,
                'doctor_index' => 4, // Orthopedics
                'condition' => 'Lower Back Pain',
                'diagnosis' => 'Lumbar disc herniation',
                'treatment' => 'Physical therapy twice weekly. Pain management with NSAIDs.',
                'notes' => 'MRI confirmed disc herniation at L4-L5. Conservative treatment first.',
                'visit_date' => now()->subMonths(2),
            ],

            // Patient 12 - Depression
            [
                'patient_index' => 12,
                'doctor_index' => 7, // Psychiatry
                'condition' => 'Major Depressive Disorder',
                'diagnosis' => 'Moderate depression',
                'treatment' => 'Fluoxetine 20mg daily. Weekly therapy sessions.',
                'notes' => 'Patient showing improvement. Sleep and appetite returning to normal.',
                'visit_date' => now()->subMonths(6),
            ],

            // Patient 13 - Arthritis
            [
                'patient_index' => 13,
                'doctor_index' => 4, // Orthopedics
                'condition' => 'Rheumatoid Arthritis',
                'diagnosis' => 'Early rheumatoid arthritis',
                'treatment' => 'Methotrexate 15mg weekly. Disease-modifying antirheumatic drugs.',
                'notes' => 'Joint inflammation reduced. Regular monitoring of liver function.',
                'visit_date' => now()->subMonths(3),
            ],

            // Patient 14 - Cataracts
            [
                'patient_index' => 14,
                'doctor_index' => 8, // Ophthalmology
                'condition' => 'Cataracts',
                'diagnosis' => 'Bilateral cataracts',
                'treatment' => 'Cataract surgery recommended for right eye.',
                'notes' => 'Vision significantly impaired. Surgery scheduled for next month.',
                'visit_date' => now()->subMonths(1),
            ],

            // Patient 15 - GERD
            [
                'patient_index' => 15,
                'doctor_index' => 9, // General Practice
                'condition' => 'Gastroesophageal Reflux Disease',
                'diagnosis' => 'Chronic GERD',
                'treatment' => 'Omeprazole 20mg daily. Dietary modifications. Elevate head of bed.',
                'notes' => 'Symptoms well controlled with medication. Lifestyle changes helping.',
                'visit_date' => now()->subMonths(5),
            ],

            // Patient 16 - Osteoporosis
            [
                'patient_index' => 16,
                'doctor_index' => 4, // Orthopedics
                'condition' => 'Osteoporosis',
                'diagnosis' => 'Postmenopausal osteoporosis',
                'treatment' => 'Calcium and vitamin D supplements. Bisphosphonates prescribed.',
                'notes' => 'Bone density scan shows significant bone loss. Fall prevention counseling provided.',
                'visit_date' => now()->subMonths(7),
            ],

            // Patient 17 - COPD
            [
                'patient_index' => 17,
                'doctor_index' => 0, // Cardiology (respiratory issues)
                'condition' => 'Chronic Obstructive Pulmonary Disease',
                'diagnosis' => 'Moderate COPD',
                'treatment' => 'Bronchodilators and inhaled corticosteroids. Smoking cessation support.',
                'notes' => 'Lung function tests show moderate obstruction. Pulmonary rehabilitation recommended.',
                'visit_date' => now()->subMonths(4),
            ],

            // Patient 18 - Endometriosis
            [
                'patient_index' => 18,
                'doctor_index' => 5, // Gynecology
                'condition' => 'Endometriosis',
                'diagnosis' => 'Stage II endometriosis',
                'treatment' => 'Hormonal therapy. Laparoscopic surgery may be needed.',
                'notes' => 'Severe pelvic pain during menstruation. Pain management optimized.',
                'visit_date' => now()->subMonths(2),
            ],

            // Patient 19 - Glaucoma
            [
                'patient_index' => 19,
                'doctor_index' => 8, // Ophthalmology
                'condition' => 'Open Angle Glaucoma',
                'diagnosis' => 'Primary open angle glaucoma',
                'treatment' => 'Latanoprost eye drops daily. Regular intraocular pressure monitoring.',
                'notes' => 'IOP well controlled. Visual field testing stable.',
                'visit_date' => now()->subMonths(3),
            ],

            // Patient 20 - Kidney stones
            [
                'patient_index' => 20,
                'doctor_index' => 9, // General Practice
                'condition' => 'Kidney Stones',
                'diagnosis' => 'Calcium oxalate kidney stones',
                'treatment' => 'Increased fluid intake. Dietary modifications. Pain management.',
                'notes' => 'Passed stone spontaneously. Recurrence prevention measures discussed.',
                'visit_date' => now()->subMonths(6),
            ],

            // Patient 21 - Sleep apnea
            [
                'patient_index' => 21,
                'doctor_index' => 2, // Neurology
                'condition' => 'Obstructive Sleep Apnea',
                'diagnosis' => 'Moderate obstructive sleep apnea',
                'treatment' => 'CPAP therapy initiated. Weight management counseling.',
                'notes' => 'Sleep study confirmed OSA. Patient tolerating CPAP well.',
                'visit_date' => now()->subMonths(2),
            ],

            // Patient 22 - Atrial fibrillation
            [
                'patient_index' => 22,
                'doctor_index' => 0, // Cardiology
                'condition' => 'Atrial Fibrillation',
                'diagnosis' => 'Paroxysmal atrial fibrillation',
                'treatment' => 'Anticoagulation therapy. Rate control medications.',
                'notes' => 'Cardioversion successful. Anticoagulation continued for stroke prevention.',
                'visit_date' => now()->subMonths(1),
            ],

            // Patient 23 - Psoriasis
            [
                'patient_index' => 23,
                'doctor_index' => 1, // Dermatology
                'condition' => 'Psoriasis',
                'diagnosis' => 'Plaque psoriasis',
                'treatment' => 'Topical corticosteroids. Phototherapy recommended.',
                'notes' => 'Skin lesions responding well to treatment. PASI score improved.',
                'visit_date' => now()->subMonths(3),
            ],

            // Patient 24 - Epilepsy
            [
                'patient_index' => 24,
                'doctor_index' => 2, // Neurology
                'condition' => 'Epilepsy',
                'diagnosis' => 'Temporal lobe epilepsy',
                'treatment' => 'Levetiracetam 1000mg twice daily. Seizure diary maintained.',
                'notes' => 'Seizure frequency reduced. Driving restrictions discussed.',
                'visit_date' => now()->subMonths(5),
            ],

            // Patient 25 - Hepatitis C
            [
                'patient_index' => 25,
                'doctor_index' => 9, // General Practice
                'condition' => 'Hepatitis C',
                'diagnosis' => 'Chronic hepatitis C',
                'treatment' => 'Antiviral therapy initiated. Regular monitoring of liver function.',
                'notes' => 'Treatment course started. Close monitoring for side effects.',
                'visit_date' => now()->subMonths(1),
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
