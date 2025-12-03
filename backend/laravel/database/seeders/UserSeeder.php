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

        // Doctor Users (7 total: 2 existing + Tasneem Gaballah + Islam Ghanem + 3 new)
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
            [
                'name' => 'Dr. Tasneem Gaballah',
                'email' => 'tasneem.gaballah@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000006',
                'date_of_birth' => '1990-03-12',
                'address' => 'Cairo, Egypt',
            ],
            [
                'name' => 'Dr. Islam Ghanem',
                'email' => 'islam.ghanem@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000010',
                'date_of_birth' => '1991-04-20',
                'address' => 'Tanta, Egypt',
            ],
            [
                'name' => 'Dr. Mohamed Hassan',
                'email' => 'mohamed.hassan@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000007',
                'date_of_birth' => '1987-11-25',
                'address' => 'Zagazig, Egypt',
            ],
            [
                'name' => 'Dr. Sara Ali',
                'email' => 'sara.ali@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000008',
                'date_of_birth' => '1992-06-18',
                'address' => 'Ismailia, Egypt',
            ],
            [
                'name' => 'Dr. Omar Khaled',
                'email' => 'omar.khaled@booking.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+201000000009',
                'date_of_birth' => '1989-09-30',
                'address' => 'Port Said, Egypt',
            ],
        ];

        foreach ($doctors as $doctor) {
            User::create($doctor);
        }

        // Patient Users (10+ total: 2 existing + 8+ new)
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
            [
                'name' => 'Mariam Ibrahim',
                'email' => 'mariam.ibrahim@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000010',
                'date_of_birth' => '1996-04-15',
                'address' => 'Cairo, Egypt',
            ],
            [
                'name' => 'Youssef Mahmoud',
                'email' => 'youssef.mahmoud@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000011',
                'date_of_birth' => '1993-08-20',
                'address' => 'Alexandria, Egypt',
            ],
            [
                'name' => 'Nour El-Din',
                'email' => 'nour.eldin@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000012',
                'date_of_birth' => '1997-12-05',
                'address' => 'Giza, Egypt',
            ],
            [
                'name' => 'Fatma Mohamed',
                'email' => 'fatma.mohamed@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000013',
                'date_of_birth' => '1994-02-28',
                'address' => 'Mansoura, Egypt',
            ],
            [
                'name' => 'Karim Abdelrahman',
                'email' => 'karim.abdelrahman@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000014',
                'date_of_birth' => '1999-10-14',
                'address' => 'Tanta, Egypt',
            ],
            [
                'name' => 'Layla Ahmed',
                'email' => 'layla.ahmed@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000015',
                'date_of_birth' => '1995-07-08',
                'address' => 'Cairo, Egypt',
            ],
            [
                'name' => 'Amr Mostafa',
                'email' => 'amr.mostafa@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000016',
                'date_of_birth' => '1992-11-22',
                'address' => 'Alexandria, Egypt',
            ],
            [
                'name' => 'Dina Samir',
                'email' => 'dina.samir@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000017',
                'date_of_birth' => '1996-05-30',
                'address' => 'Giza, Egypt',
            ],
            [
                'name' => 'Hassan Farouk',
                'email' => 'hassan.farouk@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000018',
                'date_of_birth' => '1991-09-17',
                'address' => 'Zagazig, Egypt',
            ],
            [
                'name' => 'Rana Tarek',
                'email' => 'rana.tarek@booking.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000019',
                'date_of_birth' => '1998-01-25',
                'address' => 'Ismailia, Egypt',
            ],
        ];

        foreach ($patients as $patient) {
            User::create($patient);
        }
    }
}
