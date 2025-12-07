<?php

namespace App\Services;

use App\Models\MedicalHistory;
use App\Models\Doctor;
use App\Models\Specialization;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MedicalKnowledgeService
{
    private $cachePrefix = 'medical_knowledge_';
    private $cacheDuration = 3600; // 1 hour

    /**
     * Retrieve relevant medical knowledge based on query
     */
    public function retrieveRelevantKnowledge(string $query, array $analysis): array
    {
        $knowledge = [];

        // Get specialization knowledge
        if (!empty($analysis['possible_specializations'])) {
            $knowledge = array_merge($knowledge, $this->getSpecializationKnowledge($analysis['possible_specializations']));
        }

        // Get symptom-based knowledge
        if (!empty($analysis['extracted_symptoms'])) {
            $knowledge = array_merge($knowledge, $this->getSymptomKnowledge($analysis['extracted_symptoms']));
        }

        // Get general medical knowledge
        $knowledge = array_merge($knowledge, $this->getGeneralMedicalKnowledge($query));

        return array_unique($knowledge);
    }

    /**
     * Get specialization-specific knowledge
     */
    private function getSpecializationKnowledge(array $specializations): array
    {
        $knowledge = [];

        foreach ($specializations as $spec) {
            $cacheKey = $this->cachePrefix . 'specialization_' . $spec;

            $specKnowledge = Cache::remember($cacheKey, $this->cacheDuration, function () use ($spec) {
                $specialization = Specialization::where('name', 'like', '%' . $spec . '%')->first();

                if (!$specialization) {
                    return [];
                }

                $doctors = Doctor::where('specialization_id', $specialization->id)
                    ->with('user')
                    ->limit(10)
                    ->get();

                $knowledge = [
                    "Specialization: {$specialization->name}",
                    "Description: {$specialization->description}",
                    "Available doctors: {$doctors->count()}",
                ];

                if ($doctors->count() > 0) {
                    $avgRating = $doctors->avg('rating') ?? 0;
                    $avgFee = $doctors->avg('consultation_fee') ?? 0;

                    $knowledge[] = "Average doctor rating: " . number_format($avgRating, 1) . "/5";
                    $knowledge[] = "Average consultation fee: $" . number_format($avgFee, 2);
                }

                return $knowledge;
            });

            $knowledge = array_merge($knowledge, $specKnowledge);
        }

        return $knowledge;
    }

    /**
     * Get symptom-based knowledge from medical history
     */
    private function getSymptomKnowledge(array $symptoms): array
    {
        $knowledge = [];

        foreach ($symptoms as $symptom) {
            $cacheKey = $this->cachePrefix . 'symptom_' . $symptom;

            $symptomKnowledge = Cache::remember($cacheKey, $this->cacheDuration, function () use ($symptom) {
                // Search medical history for similar conditions
                $histories = MedicalHistory::where(function ($query) use ($symptom) {
                    $query->where('condition', 'like', '%' . $symptom . '%')
                          ->orWhere('diagnosis', 'like', '%' . $symptom . '%')
                          ->orWhere('notes', 'like', '%' . $symptom . '%');
                })
                ->with(['doctor.user', 'patient'])
                ->limit(5)
                ->get();

                $knowledge = [];

                if ($histories->count() > 0) {
                    $knowledge[] = "Found {$histories->count()} relevant medical cases for symptom: {$symptom}";

                    foreach ($histories as $history) {
                        $knowledge[] = "Case: {$history->condition} - Diagnosis: {$history->diagnosis}";
                        if ($history->treatment) {
                            $knowledge[] = "Treatment: {$history->treatment}";
                        }
                    }
                }

                return $knowledge;
            });

            $knowledge = array_merge($knowledge, $symptomKnowledge);
        }

        return $knowledge;
    }

    /**
     * Get general medical knowledge and common patterns
     */
    private function getGeneralMedicalKnowledge(string $query): array
    {
        $knowledge = [];
        $queryLower = strtolower($query);

        // Common medical knowledge patterns
        $medicalPatterns = [
            'emergency' => [
                'Emergency symptoms require immediate medical attention',
                'Call emergency services (911/999) for severe symptoms',
                'Do not delay seeking help for emergency situations'
            ],
            'pain' => [
                'Pain assessment considers location, intensity, duration, and character',
                'Severe or worsening pain requires medical evaluation',
                'Pain management includes both medication and non-pharmacological approaches'
            ],
            'fever' => [
                'Fever is often a sign that the body is fighting infection',
                'High fever (>103°F/39.4°C) in adults requires medical attention',
                'Monitor temperature and seek medical care if fever persists'
            ],
            'headache' => [
                'Most headaches are benign but some require urgent care',
                'Sudden severe headache may indicate serious conditions',
                'Keep headache diary to identify patterns and triggers'
            ]
        ];

        foreach ($medicalPatterns as $keyword => $info) {
            if (strpos($queryLower, $keyword) !== false) {
                $knowledge = array_merge($knowledge, $info);
            }
        }

        return $knowledge;
    }

    /**
     * Cache medical Q&A for future retrieval
     */
    public function cacheQuestionAnswer(string $question, string $answer, array $context = []): void
    {
        $cacheKey = $this->cachePrefix . 'qa_' . md5($question);

        Cache::put($cacheKey, [
            'question' => $question,
            'answer' => $answer,
            'context' => $context,
            'cached_at' => now(),
            'usage_count' => 0
        ], $this->cacheDuration * 24); // Cache for 24 hours
    }

    /**
     * Retrieve cached similar questions
     */
    public function getSimilarCachedAnswer(string $question): ?array
    {
        $questionHash = md5($question);
        $cacheKey = $this->cachePrefix . 'qa_' . $questionHash;

        $cached = Cache::get($cacheKey);
        if ($cached) {
            // Increment usage count
            $cached['usage_count']++;
            Cache::put($cacheKey, $cached, $this->cacheDuration * 24);

            return $cached;
        }

        // For now, skip similarity search to avoid Redis keys() method issues
        // This can be implemented later with a proper caching strategy
        return null;
    }

    /**
     * Calculate text similarity using simple Jaccard similarity
     */
    private function calculateSimilarity(string $text1, string $text2): float
    {
        $words1 = array_unique(str_word_count(strtolower($text1), 1));
        $words2 = array_unique(str_word_count(strtolower($text2), 1));

        $intersection = array_intersect($words1, $words2);
        $union = array_unique(array_merge($words1, $words2));

        return count($intersection) / count($union);
    }

    /**
     * Get medical statistics and insights
     */
    public function getMedicalStatistics(): array
    {
        $cacheKey = $this->cachePrefix . 'statistics';

        return Cache::remember($cacheKey, $this->cacheDuration, function () {
            return [
                'total_doctors' => Doctor::count(),
                'total_specializations' => Specialization::count(),
                'total_medical_records' => MedicalHistory::count(),
                'avg_doctor_rating' => Doctor::avg('rating') ?? 0,
                'most_common_specializations' => Specialization::withCount('doctors')
                    ->orderBy('doctors_count', 'desc')
                    ->limit(5)
                    ->pluck('name')
                    ->toArray()
            ];
        });
    }

    /**
     * Get detailed doctor information from database only
     * Doctor data is now fully managed in the database
     */
    public function getDoctorInfo(string $doctorName): ?array
    {
        $cacheKey = $this->cachePrefix . 'doctor_info_' . md5($doctorName) . '_' . time(); // Add timestamp to avoid caching

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($doctorName) {
            \Log::info('Getting doctor info from database for: ' . $doctorName);

            // Get doctor info from database only
            $databaseInfo = $this->getDoctorInfoFromDatabase($doctorName);
            if ($databaseInfo) {
                \Log::info('Found doctor info in database', ['doctor' => $databaseInfo]);
                return $databaseInfo;
            }

            \Log::info('Doctor not found in database: ' . $doctorName);
            return null;
        });
    }

    /**
     * Get doctor information from database
     */
    private function getDoctorInfoFromDatabase(string $doctorName): ?array
    {
        // Clean up the doctor name for better matching
        $cleanName = $this->cleanDoctorName($doctorName);

        // Search for doctors in database
        $doctor = \App\Models\Doctor::with(['user', 'specialization'])
            ->whereHas('user', function ($query) use ($cleanName) {
                $query->where('name', 'like', '%' . $cleanName . '%')
                      ->orWhere('name', 'like', '%' . str_replace(' ', '%', $cleanName) . '%');
            })
            ->where('is_approved', true)
            ->first();

        if (!$doctor) {
            return null;
        }

        // Format the doctor information consistently with knowledge base structure
        return [
            'full_name' => $doctor->user->name,
            'email' => $doctor->user->email,
            'phone' => $doctor->user->phone,
            'date_of_birth' => $doctor->user->date_of_birth ? $doctor->user->date_of_birth->format('Y-m-d') : null,
            'address' => $doctor->user->address,
            'specialization' => $doctor->specialization ? $doctor->specialization->name : 'General Practice',
            'license_number' => $doctor->license_number,
            'experience' => $doctor->experience_years ? $doctor->experience_years . ' years' : null,
            'consultation_fee' => $doctor->consultation_fee ? '$' . number_format($doctor->consultation_fee, 2) : null,
            'rating' => $doctor->rating ? number_format($doctor->rating, 1) . '/5.0' : null,
            'status' => $doctor->is_approved ? 'Approved and Active' : 'Pending Approval',
            'biography' => $doctor->biography,
            'key_expertise' => $doctor->specialization ? $doctor->specialization->description : null,
        ];
    }


    /**
     * Clean doctor name for better database matching
     */
    private function cleanDoctorName(string $doctorName): string
    {
        // Remove common prefixes
        $cleanName = preg_replace('/^(dr\.?|doctor)\s+/i', '', trim($doctorName));

        // Remove extra spaces
        return preg_replace('/\s+/', ' ', $cleanName);
    }



    /**
     * Clear knowledge cache (for maintenance)
     */
    public function clearCache(): void
    {
        Cache::forget($this->cachePrefix . '*');
    }
}
