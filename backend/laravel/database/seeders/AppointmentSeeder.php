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

        $appointments = [
            // ========== PAST APPOINTMENTS (Completed) ==========
            [
                'patient_index' => 0,
                'doctor_index' => 0, // Cardiology
                'date_offset' => -7,
                'time' => '10:00',
                'duration' => 30,
                'status' => 'completed',
                'reason' => 'Cardiac checkup',
                'notes' => 'ECG performed, results normal. Blood pressure well controlled.',
            ],
            [
                'patient_index' => 1,
                'doctor_index' => 1, // Dermatology
                'date_offset' => -5,
                'time' => '14:00',
                'duration' => 45,
                'status' => 'completed',
                'reason' => 'Skin allergy treatment',
                'notes' => 'Prescribed topical cream. Follow-up in 2 weeks.',
            ],
            [
                'patient_index' => 2,
                'doctor_index' => 2, // Neurology
                'date_offset' => -10,
                'time' => '11:00',
                'duration' => 60,
                'status' => 'completed',
                'reason' => 'Migraine consultation',
                'notes' => 'Neurological examination normal. Prescribed preventive medication.',
            ],
            [
                'patient_index' => 3,
                'doctor_index' => 3, // Pediatrics
                'date_offset' => -3,
                'time' => '09:00',
                'duration' => 30,
                'status' => 'completed',
                'reason' => 'Child vaccination',
                'notes' => 'Vaccination administered successfully. No adverse reactions.',
            ],
            [
                'patient_index' => 4,
                'doctor_index' => 0, // Cardiology
                'date_offset' => -14,
                'time' => '15:00',
                'duration' => 45,
                'status' => 'completed',
                'reason' => 'Hypertension follow-up',
                'notes' => 'Blood pressure improved. Continue current medication.',
            ],
            [
                'patient_index' => 5,
                'doctor_index' => 4, // Orthopedics
                'date_offset' => -8,
                'time' => '13:00',
                'duration' => 60,
                'status' => 'completed',
                'reason' => 'Knee pain evaluation',
                'notes' => 'X-ray shows improvement. Physical therapy recommended.',
            ],
            [
                'patient_index' => 6,
                'doctor_index' => 1, // Dermatology
                'date_offset' => -12,
                'time' => '10:30',
                'duration' => 30,
                'status' => 'completed',
                'reason' => 'Acne treatment',
                'notes' => 'Skin condition improving. Continue treatment plan.',
            ],
            [
                'patient_index' => 7,
                'doctor_index' => 5, // Gynecology
                'date_offset' => -6,
                'time' => '14:30',
                'duration' => 45,
                'status' => 'completed',
                'reason' => 'Annual checkup',
                'notes' => 'Routine examination completed. All tests normal.',
            ],

            // ========== PAST APPOINTMENTS (Cancelled) ==========
            [
                'patient_index' => 0,
                'doctor_index' => 1,
                'date_offset' => -4,
                'time' => '11:00',
                'duration' => 30,
                'status' => 'cancelled',
                'reason' => 'Skin consultation',
                'notes' => 'Patient cancelled due to travel',
            ],
            [
                'patient_index' => 2,
                'doctor_index' => 0,
                'date_offset' => -6,
                'time' => '16:00',
                'duration' => 45,
                'status' => 'cancelled',
                'reason' => 'Cardiology appointment',
                'notes' => 'Cancelled by patient - rescheduled',
            ],

            // ========== TODAY ==========
            [
                'patient_index' => 0,
                'doctor_index' => 0,
                'date_offset' => 0,
                'time' => '09:00',
                'duration' => 30,
                'status' => 'confirmed',
                'reason' => 'Cardiology follow-up',
            ],
            [
                'patient_index' => 1,
                'doctor_index' => 2,
                'date_offset' => 0,
                'time' => '10:00',
                'duration' => 45,
                'status' => 'pending',
                'reason' => 'Headache consultation',
            ],
            [
                'patient_index' => 3,
                'doctor_index' => 3,
                'date_offset' => 0,
                'time' => '14:00',
                'duration' => 30,
                'status' => 'confirmed',
                'reason' => 'Child health check',
            ],
            [
                'patient_index' => 8,
                'doctor_index' => 4,
                'date_offset' => 0,
                'time' => '15:00',
                'duration' => 60,
                'status' => 'pending',
                'reason' => 'Back pain evaluation',
            ],

            // ========== TOMORROW ==========
            [
                'patient_index' => 2,
                'doctor_index' => 2,
                'date_offset' => 1,
                'time' => '09:00',
                'duration' => 60,
                'status' => 'confirmed',
                'reason' => 'Neurological follow-up',
            ],
            [
                'patient_index' => 4,
                'doctor_index' => 0,
                'date_offset' => 1,
                'time' => '11:00',
                'duration' => 45,
                'status' => 'confirmed',
                'reason' => 'Diabetes and heart check',
            ],
            [
                'patient_index' => 5,
                'doctor_index' => 1,
                'date_offset' => 1,
                'time' => '13:00',
                'duration' => 30,
                'status' => 'confirmed',
                'reason' => 'Dermatology consultation',
            ],
            [
                'patient_index' => 9,
                'doctor_index' => 3,
                'date_offset' => 1,
                'time' => '15:00',
                'duration' => 30,
                'status' => 'pending',
                'reason' => 'Pediatric consultation',
            ],

            // ========== UPCOMING DAYS (2-7 days) ==========
            [
                'patient_index' => 1,
                'doctor_index' => 0,
                'date_offset' => 2,
                'time' => '10:00',
                'duration' => 30,
                'status' => 'confirmed',
                'reason' => 'Cardiac screening',
            ],
            [
                'patient_index' => 6,
                'doctor_index' => 1,
                'date_offset' => 2,
                'time' => '14:00',
                'duration' => 45,
                'status' => 'pending',
                'reason' => 'Skin condition follow-up',
            ],
            [
                'patient_index' => 7,
                'doctor_index' => 5,
                'date_offset' => 3,
                'time' => '10:00',
                'duration' => 45,
                'status' => 'confirmed',
                'reason' => 'Gynecology consultation',
            ],
            [
                'patient_index' => 10,
                'doctor_index' => 2,
                'date_offset' => 3,
                'time' => '11:00',
                'duration' => 60,
                'status' => 'confirmed',
                'reason' => 'Neurological examination',
            ],
            [
                'patient_index' => 2,
                'doctor_index' => 4,
                'date_offset' => 4,
                'time' => '13:00',
                'duration' => 60,
                'status' => 'pending',
                'reason' => 'Orthopedic consultation',
            ],
            [
                'patient_index' => 11,
                'doctor_index' => 5,
                'date_offset' => 4,
                'time' => '15:00',
                'duration' => 45,
                'status' => 'confirmed',
                'reason' => 'Women\'s health checkup',
            ],
            [
                'patient_index' => 3,
                'doctor_index' => 3,
                'date_offset' => 5,
                'time' => '09:00',
                'duration' => 30,
                'status' => 'confirmed',
                'reason' => 'Pediatric follow-up',
            ],
            [
                'patient_index' => 8,
                'doctor_index' => 0,
                'date_offset' => 5,
                'time' => '14:00',
                'duration' => 45,
                'status' => 'pending',
                'reason' => 'Cardiology consultation',
            ],
            [
                'patient_index' => 4,
                'doctor_index' => 2,
                'date_offset' => 6,
                'time' => '10:00',
                'duration' => 60,
                'status' => 'confirmed',
                'reason' => 'Neurological follow-up',
            ],
            [
                'patient_index' => 5,
                'doctor_index' => 4,
                'date_offset' => 7,
                'time' => '11:00',
                'duration' => 60,
                'status' => 'confirmed',
                'reason' => 'Sports injury evaluation',
            ],
        ];

        foreach ($appointments as $appt) {
            $patient = $patients[$appt['patient_index'] % $patients->count()];
            $doctor = $doctors[$appt['doctor_index'] % $doctors->count()];

            $appointmentDate = now()->addDays($appt['date_offset'])->format('Y-m-d');
            $startTime = $appt['time'];
            $endTime = date('H:i', strtotime($startTime . ' +' . $appt['duration'] . ' minutes'));

            Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $appointmentDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => $appt['status'],
                'reason' => $appt['reason'],
                'notes' => $appt['notes'] ?? null,
            ]);
        }

        $this->command->info('Appointments seeded successfully!');
    }
}
