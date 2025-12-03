<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            SpecializationSeeder::class,
            UserSeeder::class,
            AdminSeeder::class,
            DoctorSeeder::class,
            PatientSeeder::class,
            ScheduleSeeder::class,
            AppointmentSeeder::class,
            PaymentSeeder::class,
            MedicalHistorySeeder::class,
            PrescriptionSeeder::class,
        ]);
    }
}
