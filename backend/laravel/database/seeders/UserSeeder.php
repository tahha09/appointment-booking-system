<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Clear existing users first
        User::query()->delete();

        $users = [];

        // Create 2 admins
        $users[] = [
            'name' => 'System Admin',
            'email' => 'system.admin@booking.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '+201000000001',
            'date_of_birth' => '1980-01-01',
            'address' => 'Cairo, Egypt',
        ];

        $users[] = [
            'name' => 'Ahmed Taha',
            'email' => 'ahmed.taha.admin@booking.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '+201000000002',
            'date_of_birth' => '1985-05-15',
            'address' => 'Alexandria, Egypt',
        ];

        // Create doctors (2 doctors per specialization × 10 specializations = 20 doctors)
        $doctorSpecializations = [
            1 => ['Dr. Ahmed Taha', 'Dr. Mahmoud Ibrahim'],
            2 => ['Dr. Aya Basheer', 'Dr. Salma Mahmoud'],
            3 => ['Dr. Tasneem Gaballah', 'Dr. Reem Ahmed'],
            4 => ['Dr. Mohamed Hassan', 'Dr. Hana Ali'],
            5 => ['Dr. Sara Ali', 'Dr. Mona Ibrahim'],
            6 => ['Dr. Omar Khaled', 'Dr. Laila Mahmoud'],
            7 => ['Dr. Islam Ghanem', 'Dr. Youssef Ahmed'],
            8 => ['Dr. Ahmed Mostafa', 'Dr. Fatma Hassan'],
            9 => ['Dr. Samira Mahmoud', 'Dr. Omar Ibrahim'],
            10 => ['Dr. Mohamed Ali', 'Dr. Amina Hassan'],
        ];

        $doctorCounter = 3; // Start phone numbers after admins
        foreach ($doctorSpecializations as $specId => $doctorNames) {
            foreach ($doctorNames as $index => $doctorName) {
                $users[] = [
                    'name' => $doctorName,
                    'email' => strtolower(str_replace([' ', '.', 'Dr. '], ['', '', ''], $doctorName)) . $specId . $index . '@booking.com',
                    'password' => Hash::make('password'),
                    'role' => 'doctor',
                    'phone' => '+201000000' . str_pad($doctorCounter, 3, '0', STR_PAD_LEFT),
                    'date_of_birth' => '198' . rand(0, 9) . '-' . str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT),
                    'address' => $this->getRandomCity(),
                ];
                $doctorCounter++;
            }
        }

        // Create 50 patients
        $firstNames = ['Ahmed', 'Mohamed', 'Ali', 'Omar', 'Hassan', 'Mahmoud', 'Khaled', 'Mostafa', 'Ibrahim', 'Youssef', 'Tarek', 'Samir', 'Karim', 'Amr', 'Ziad', 'Hesham', 'Gamal', 'Ramadan', 'Maged', 'Fady'];
        $lastNames = ['Hassan', 'Ali', 'Mahmoud', 'Ahmed', 'Mostafa', 'Ibrahim', 'Farouk', 'Samir', 'Tarek', 'Abdelrahman', 'El-Din', 'Hussein', 'Saeed', 'Nasser', 'Salem', 'Adel', 'Fouad', 'Rashad', 'Wael', 'Hani'];

        $patientCounter = $doctorCounter;
        for ($i = 1; $i <= 50; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];

            $users[] = [
                'name' => $firstName . ' ' . $lastName,
                'email' => strtolower($firstName . '.' . $lastName . '.patient' . $i . '@booking.com'),
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '+201000000' . str_pad($patientCounter, 3, '0', STR_PAD_LEFT),
                'date_of_birth' => '199' . rand(0, 9) . '-' . str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT),
                'address' => $this->getRandomCity(),
            ];
            $patientCounter++;
        }

        // Create all users
        foreach ($users as $userData) {
            User::create($userData);
        }

        $this->command->info('Users seeded successfully! Created:');
        $this->command->info('- 2 Admins');
        $this->command->info('- 20 Doctors (2 per specialization)');
        $this->command->info('- 50 Patients');
    }

    private function getRandomCity()
    {
        $cities = ['Cairo', 'Alexandria', 'Giza', 'Tanta', 'Zagazig', 'Ismailia', 'Port Said', 'Mansoura', 'Luxor', 'Aswan'];
        return $cities[array_rand($cities)] . ', Egypt';
    }
}
