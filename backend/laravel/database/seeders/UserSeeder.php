<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Admin User
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@booking.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '+201000000001',
            'date_of_birth' => '1980-01-01',
            'address' => 'Cairo, Egypt',
        ]);

        // Doctor Users
        $doctors = [
            [
                'name' => 'Dr. Ahmed Taha',
                'email' => 'doctor1@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000002',
                'date_of_birth' => '1985-05-15',
                'address' => 'Alexandria, Egypt',
            ],
            [
                'name' => 'Dr. Aya Basheer',
                'email' => 'doctor2@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000003',
                'date_of_birth' => '1988-08-20',
                'address' => 'Giza, Egypt',
            ],
        ];

        foreach ($doctors as $doctor) {
            User::create($doctor);
        }

        // Patient Users
        $patients = [
            [
                'name' => 'Patient Test User',
                'email' => 'patient@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000004',
                'date_of_birth' => '1995-03-10',
                'address' => 'Mansoura, Egypt',
            ],
            [
                'name' => 'Eslam Ghanem',
                'email' => 'eslam@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000005',
                'date_of_birth' => '1998-07-22',
                'address' => 'Tanta, Egypt',
            ],
        ];

        foreach ($patients as $patient) {
            User::create($patient);
        }
    }
}
