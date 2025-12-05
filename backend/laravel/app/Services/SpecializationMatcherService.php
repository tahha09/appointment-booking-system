<?php

namespace App\Services;

use App\Models\Specialization;
use App\Models\Doctor;

class SpecializationMatcherService
{
    public function findSpecializationInfo(string $specializationName): ?array
    {
        $specialization = Specialization::where('name', 'like', "%{$specializationName}%")->first();

        if (!$specialization) {
            return null;
        }

        $doctors = Doctor::with('user')
            ->where('specialization_id', $specialization->id)
            ->where('is_approved', true)
            ->orderBy('rating', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user->name ?? 'Dr. ' . $doctor->id,
                    'experience_years' => $doctor->experience_years,
                    'rating' => $doctor->rating,
                    'consultation_fee' => $doctor->consultation_fee,
                    'bio' => $doctor->biography
                ];
            });

        return [
            'id' => $specialization->id,
            'name' => $specialization->name,
            'description' => $specialization->description,
            'doctors_count' => $doctors->count(),
            'top_doctors' => $doctors,
            'average_fee' => $doctors->avg('consultation_fee') ?? 0,
            'average_experience' => $doctors->avg('experience_years') ?? 0,
            'average_rating' => $doctors->avg('rating') ?? 0
        ];
    }

    public function findDoctorsForSymptoms(array $symptoms, array $specializations): array
    {
        $recommendedDoctors = [];

        foreach ($specializations as $specName) {
            $specialization = Specialization::where('name', 'like', "%{$specName}%")->first();

            if ($specialization) {
                $doctors = Doctor::with('user')
                    ->where('specialization_id', $specialization->id)
                    ->where('is_approved', true)
                    ->orderBy('rating', 'desc')
                    ->orderBy('experience_years', 'desc')
                    ->limit(3)
                    ->get();

                foreach ($doctors as $doctor) {
                    $recommendedDoctors[] = [
                        'doctor' => [
                            'id' => $doctor->id,
                            'name' => $doctor->user->name ?? 'Dr. ' . $doctor->id,
                            'specialization' => $specialization->name,
                            'experience_years' => $doctor->experience_years,
                            'rating' => $doctor->rating,
                            'consultation_fee' => $doctor->consultation_fee,
                            'bio' => $doctor->biography,
                            'match_reason' => "Specializes in {$specialization->name} which treats " . implode(', ', $symptoms)
                        ],
                        'match_score' => $this->calculateMatchScore($doctor, $symptoms)
                    ];
                }
            }
        }

        // Sort by match score
        usort($recommendedDoctors, function ($a, $b) {
            return $b['match_score'] <=> $a['match_score'];
        });

        return array_slice($recommendedDoctors, 0, 3);
    }

    private function calculateMatchScore(Doctor $doctor, array $symptoms): float
    {
        $score = 0;

        // Higher rating = higher score
        $score += $doctor->rating * 10;

        // More experience = higher score
        $score += min($doctor->experience_years, 30);

        // If doctor's bio mentions symptoms, add bonus
        $bio = strtolower($doctor->biography ?? '');
        foreach ($symptoms as $symptom) {
            if (strpos($bio, strtolower($symptom)) !== false) {
                $score += 20;
            }
        }

        return $score;
    }
}
