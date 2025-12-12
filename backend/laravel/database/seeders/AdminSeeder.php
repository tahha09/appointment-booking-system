<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run()
    {
        $adminEmails = ['system.admin@booking.com', 'ahmed.taha.admin@booking.com'];

        foreach ($adminEmails as $email) {
            $adminUser = User::where('email', $email)->first();

            if ($adminUser) {
                Admin::create([
                    'user_id' => $adminUser->id,
                    'permissions' => [
                        'manage_users',
                        'manage_doctors',
                        'manage_appointments',
                        'manage_patients',
                        'view_reports',
                        'manage_schedules',
                        'manage_payments',
                        'manage_specializations',
                    ],
                    'department' => 'Administration',
                    'admin_level' => 'super_admin',
                ]);
            }
        }

        $this->command->info('Admin records seeded successfully!');
    }
}
