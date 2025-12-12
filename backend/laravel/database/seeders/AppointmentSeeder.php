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

        $appointments = [];

        // Create 3 appointments per doctor with different patients
        foreach ($doctors as $doctor) {
            // Get 3 different random patients for this doctor
            $selectedPatients = $patients->random(min(3, $patients->count()));

            foreach ($selectedPatients as $patient) {
                // Create appointment with different statuses
                $statusOptions = ['pending', 'confirmed', 'completed'];
                $status = $statusOptions[array_rand($statusOptions)];

                // Generate appointment date based on status
                $appointmentDate = $this->generateAppointmentDate($status);

                // Generate time
                $timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
                $startTime = $timeSlots[array_rand($timeSlots)];

                // Duration
                $duration = rand(20, 60);

                // Reason based on specialization
                $reason = $this->getAppointmentReason($doctor->specialization_id);

                // Notes
                $notes = $this->generateNotes($status);

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

        $this->command->info('Appointments seeded successfully! Created ' . count($appointments) . ' appointments.');
    }

    private function generateAppointmentDate($status)
    {
        $today = now();

        if ($status === 'completed') {
            // Past date (1-30 days ago)
            return $today->subDays(rand(1, 30))->format('Y-m-d');
        } elseif ($status === 'pending') {
            // Future date (1-14 days from now)
            return $today->addDays(rand(1, 14))->format('Y-m-d');
        } else { // confirmed
            // Mix of past and future (50/50)
            if (rand(0, 1)) {
                return $today->subDays(rand(1, 7))->format('Y-m-d');
            } else {
                return $today->addDays(rand(1, 7))->format('Y-m-d');
            }
        }
    }

    private function getAppointmentReason($specializationId)
    {
        $reasons = [
            1 => ['Cardiac checkup', 'Heart screening', 'Hypertension follow-up'],
            2 => ['Skin allergy treatment', 'Acne consultation', 'Dermatology screening'],
            3 => ['Migraine consultation', 'Neurological examination', 'Headache evaluation'],
            4 => ['Child vaccination', 'Pediatric checkup', 'Growth monitoring'],
            5 => ['Knee pain evaluation', 'Sports injury assessment', 'Joint pain consultation'],
            6 => ['Annual checkup', 'Pregnancy consultation', 'Gynecology screening'],
            7 => ['Dental cleaning', 'Tooth pain consultation', 'Orthodontic consultation'],
            8 => ['Mental health consultation', 'Depression treatment', 'Anxiety management'],
            9 => ['Eye examination', 'Vision screening', 'Cataract consultation'],
            10 => ['General checkup', 'Preventive screening', 'Chronic disease management'],
        ];

        $reasonList = $reasons[$specializationId] ?? ['General consultation'];
        return $reasonList[array_rand($reasonList)];
    }

    private function generateNotes($status)
    {
        if ($status === 'completed') {
            $notes = [
                'Consultation completed successfully.',
                'Treatment plan discussed and implemented.',
                'Examination completed. Results discussed.',
                'Procedure performed successfully.',
                'Check-up completed. All vitals normal.',
            ];
            return $notes[array_rand($notes)];
        } elseif ($status === 'cancelled') {
            $notes = [
                'Patient cancelled due to personal reasons.',
                'Doctor unavailable - rescheduled.',
                'Patient requested cancellation.',
            ];
            return $notes[array_rand($notes)];
        }

        return null;
    }
}
