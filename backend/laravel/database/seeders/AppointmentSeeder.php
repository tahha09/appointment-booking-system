<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    public function run()
    {
        $doctors = Doctor::all();
        $patients = Patient::all();

        if ($doctors->isEmpty() || $patients->isEmpty()) {
            $this->command->warn('No doctors or patients found. Please run UserSeeder, DoctorSeeder, and PatientSeeder first.');
            return;
        }

        // Current date is December 7, 2025
        $currentDate = now()->format('Y-m-d'); // 2025-12-07

        // Each patient needs 2 appointments with 2 different doctors
        $appointments = [];

        // Define appointment reasons by specialization
        $appointmentReasons = [
            1 => ['Cardiac checkup', 'Heart screening', 'Hypertension follow-up', 'Chest pain evaluation', 'ECG consultation', 'Cardiac rehabilitation'],
            2 => ['Skin allergy treatment', 'Acne consultation', 'Dermatology screening', 'Skin cancer check', 'Cosmetic dermatology', 'Hair loss treatment'],
            3 => ['Migraine consultation', 'Neurological examination', 'Headache evaluation', 'Seizure consultation', 'Memory assessment', 'Stroke prevention'],
            4 => ['Child vaccination', 'Pediatric checkup', 'Growth monitoring', 'Developmental screening', 'Child illness', 'Well-baby visit'],
            5 => ['Knee pain evaluation', 'Sports injury assessment', 'Joint pain consultation', 'Fracture follow-up', 'Back pain treatment', 'Physical therapy referral'],
            6 => ['Annual checkup', 'Pregnancy consultation', 'Gynecology screening', 'Menopause management', 'Contraception counseling', 'Fertility consultation'],
            7 => ['Dental cleaning', 'Tooth pain consultation', 'Orthodontic consultation', 'Oral surgery', 'Dental implant consultation', 'Periodontal treatment'],
            8 => ['Mental health consultation', 'Depression treatment', 'Anxiety management', 'Therapy session', 'Psychiatric evaluation', 'Medication management'],
            9 => ['Eye examination', 'Vision screening', 'Cataract consultation', 'Glaucoma check', 'Retinal evaluation', 'Contact lens fitting'],
            10 => ['General checkup', 'Preventive screening', 'Chronic disease management', 'Health maintenance', 'Routine examination', 'Health consultation']
        ];

        // Create 2 appointments per patient
        foreach ($patients as $patientIndex => $patient) {
            // Get 2 random doctors from different specializations for each patient
            $doctorIndices = [];
            $specializationIds = [];

            // First appointment - random doctor
            do {
                $doctorIndex1 = rand(0, $doctors->count() - 1);
                $doctor1 = $doctors[$doctorIndex1];
                $specId1 = $doctor1->specialization_id;
            } while (in_array($specId1, $specializationIds));

            $doctorIndices[] = $doctorIndex1;
            $specializationIds[] = $specId1;

            // Second appointment - different specialization
            do {
                $doctorIndex2 = rand(0, $doctors->count() - 1);
                $doctor2 = $doctors[$doctorIndex2];
                $specId2 = $doctor2->specialization_id;
            } while (in_array($specId2, $specializationIds));

            $doctorIndices[] = $doctorIndex2;

            // Create appointments for this patient
            for ($apptNum = 0; $apptNum < 2; $apptNum++) {
                $doctorIndex = $doctorIndices[$apptNum];
                $doctor = $doctors[$doctorIndex];
                $specializationId = $doctor->specialization_id;

                // Determine appointment date based on current date (Dec 7, 2025)
                $dateOptions = [];

                // Dec 5-6: Past dates (completed/cancelled)
                for ($day = 5; $day <= 6; $day++) {
                    $dateOptions[] = ['date' => "2025-12-{$day}", 'status_options' => ['completed', 'cancelled']];
                }

                // Dec 7: Today (mixed statuses)
                $dateOptions[] = ['date' => '2025-12-07', 'status_options' => ['confirmed', 'pending', 'completed']];

                // Dec 8-20: Future dates (upcoming)
                for ($day = 8; $day <= 20; $day++) {
                    $dateOptions[] = ['date' => "2025-12-{$day}", 'status_options' => ['confirmed', 'pending']];
                }

                $selectedDateOption = $dateOptions[array_rand($dateOptions)];
                $appointmentDate = $selectedDateOption['date'];
                $statusOptions = $selectedDateOption['status_options'];
                $status = $statusOptions[array_rand($statusOptions)];

                // Time slots
                $timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
                $startTime = $timeSlots[array_rand($timeSlots)];

                // Duration based on specialization
                $durations = [20, 30, 45, 60];
                $duration = $durations[array_rand($durations)];

                // Reason based on specialization
                $reasons = $appointmentReasons[$specializationId];
                $reason = $reasons[array_rand($reasons)];

                // Notes for completed appointments
                $notes = null;
                if ($status === 'completed') {
                    $completionNotes = [
                        'Consultation completed successfully. Follow-up recommended.',
                        'Treatment plan discussed and implemented.',
                        'Examination completed. Results discussed with patient.',
                        'Procedure performed successfully.',
                        'Consultation completed. Medication prescribed.',
                        'Check-up completed. All vitals normal.',
                        'Examination completed. Further tests recommended.',
                        'Consultation completed. Patient educated on condition.'
                    ];
                    $notes = $completionNotes[array_rand($completionNotes)];
                } elseif ($status === 'cancelled') {
                    $cancelNotes = [
                        'Patient cancelled due to personal reasons.',
                        'Doctor unavailable - rescheduled.',
                        'Patient requested cancellation.',
                        'Emergency situation - appointment postponed.'
                    ];
                    $notes = $cancelNotes[array_rand($cancelNotes)];
                }

                $appointments[] = [
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'appointment_date' => $appointmentDate,
                    'start_time' => $startTime,
                    'end_time' => date('H:i', strtotime($startTime . ' +' . $duration . ' minutes')),
                    'status' => $status,
                    'reason' => $reason,
                    'notes' => $notes,
                ];
            }
        }

        // Create appointments in database
        foreach ($appointments as $appointmentData) {
            Appointment::create($appointmentData);
        }

        $this->command->info('Appointments seeded successfully! Created ' . count($appointments) . ' appointments for ' . $patients->count() . ' patients.');
    }
}
