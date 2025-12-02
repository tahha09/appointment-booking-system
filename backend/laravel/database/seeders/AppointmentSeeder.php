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
        $doctor = Doctor::first();
        $patient = Patient::first();

        // ========== PAST APPOINTMENTS ==========

        // 1 DAY AGO - completed
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->subDay()->format('Y-m-d'),
            'start_time'      => '10:00',
            'end_time'        => '10:30',
            'status'          => 'completed',
            'reason'          => 'Vaccination appointment',
            'notes'           => 'Vaccine administered successfully',
        ]);

        // 3 DAYS AGO - completed
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->subDays(3)->format('Y-m-d'),
            'start_time'      => '14:00',
            'end_time'        => '14:45',
            'status'          => 'completed',
            'reason'          => 'General health check',
            'notes'           => 'Patient is in good condition',
        ]);

        // 5 DAYS AGO - cancelled
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->subDays(5)->format('Y-m-d'),
            'start_time'      => '11:30',
            'end_time'        => '12:15',
            'status'          => 'cancelled',
            'reason'          => 'Emergency consultation',
            'notes'           => 'Patient cancelled due to travel',
        ]);


        // ========== TODAY ==========

        // Today morning - confirmed
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->format('Y-m-d'),
            'start_time'      => '09:00',
            'end_time'        => '09:30',
            'status'          => 'confirmed',
            'reason'          => 'Morning consultation',
        ]);

        // Today afternoon - pending
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->format('Y-m-d'),
            'start_time'      => '15:00',
            'end_time'        => '15:30',
            'status'          => 'pending',
            'reason'          => 'Afternoon checkup',
        ]);


        // ========== TOMORROW ==========

        // Tomorrow morning - confirmed
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDay()->format('Y-m-d'),
            'start_time'      => '10:00',
            'end_time'        => '10:45',
            'status'          => 'confirmed',
            'reason'          => 'Cardiology follow-up',
        ]);

        // Tomorrow afternoon - confirmed
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDay()->format('Y-m-d'),
            'start_time'      => '15:30',
            'end_time'        => '16:15',
            'status'          => 'confirmed',
            'reason'          => 'Blood test results',
        ]);


        // ========== UPCOMING DAYS ==========

        // 2 DAYS FROM NOW
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDays(2)->format('Y-m-d'),
            'start_time'      => '11:00',
            'end_time'        => '11:30',
            'status'          => 'pending',
            'reason'          => 'Skin examination',
        ]);

        // 3 DAYS FROM NOW
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDays(3)->format('Y-m-d'),
            'start_time'      => '13:00',
            'end_time'        => '13:45',
            'status'          => 'confirmed',
            'reason'          => 'Eye checkup',
        ]);

        // 4 DAYS FROM NOW
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDays(4)->format('Y-m-d'),
            'start_time'      => '14:00',
            'end_time'        => '14:30',
            'status'          => 'pending',
            'reason'          => 'Follow-up appointment',
        ]);

        // 5 DAYS FROM NOW
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDays(5)->format('Y-m-d'),
            'start_time'      => '16:00',
            'end_time'        => '16:30',
            'status'          => 'confirmed',
            'reason'          => 'Diabetes management',
        ]);

        // 6 DAYS FROM NOW
        Appointment::create([
            'patient_id'      => $patient->id,
            'doctor_id'       => $doctor->id,
            'appointment_date'=> now()->addDays(6)->format('Y-m-d'),
            'start_time'      => '10:00',
            'end_time'        => '10:30',
            'status'          => 'confirmed',
            'reason'          => 'Regular heart checkup',
        ]);
    }
}
