<?php

namespace Database\Seeders;

use App\Models\Specialization;
use Illuminate\Database\Seeder;

class SpecializationSeeder extends Seeder
{
    public function run()
    {
        $specializations = [
            ['name' => 'Cardiology', 'description' => 'Heart and cardiovascular system specialist'],
            ['name' => 'Dermatology', 'description' => 'Skin, hair, and nail specialist'],
            ['name' => 'Neurology', 'description' => 'Brain and nervous system specialist'],
            ['name' => 'Pediatrics', 'description' => 'Child healthcare specialist'],
            ['name' => 'Orthopedics', 'description' => 'Bones and joints specialist'],
            ['name' => 'Gynecology', 'description' => 'Female reproductive system specialist'],
            ['name' => 'Dentistry', 'description' => 'Teeth and oral health specialist'],
            ['name' => 'Psychiatry', 'description' => 'Mental health specialist'],
            ['name' => 'Ophthalmology', 'description' => 'Eye and vision specialist'],
            ['name' => 'General Practice', 'description' => 'Primary care physician'],
        ];

        foreach ($specializations as $specialization) {
            Specialization::create($specialization);
        }
    }
}
