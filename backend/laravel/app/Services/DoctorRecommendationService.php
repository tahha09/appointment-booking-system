<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Specialization;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DoctorRecommendationService
{
    private $queryAnalyzer;
    private $specializationMatcher;
    private $knowledgeService;

    public function __construct(
        MedicalQueryAnalyzerService $queryAnalyzer,
        SpecializationMatcherService $specializationMatcher
    ) {
        $this->queryAnalyzer = $queryAnalyzer;
        $this->specializationMatcher = $specializationMatcher;
        $this->knowledgeService = app(MedicalKnowledgeService::class);
    }

    public function getRecommendations(string $query): array
    {
        try {
            // TODO: Re-enable cached similar question lookup when Redis keys() issue is resolved
            // For now, skip caching to avoid Redis compatibility issues

            // Analyze the query
            $analysis = $this->queryAnalyzer->analyze($query);

            // Retrieve relevant knowledge for RAG
            $knowledge = $this->knowledgeService->retrieveRelevantKnowledge($query, $analysis);

            $response = [
                'analysis' => $analysis,
                'response' => [],
                'success' => true
            ];

            // Add knowledge context to analysis
            $response['analysis']['knowledge_context'] = $knowledge;

            // Handle different query types with RAG-enhanced responses
            Log::info('AI Query Analysis', ['type' => $analysis['type'], 'query' => $analysis['query']]);
            switch ($analysis['type']) {
                case 'specialization_info':
                    Log::info('Handling specialization_info query');
                    $response['response'] = $this->handleSpecializationInfo($analysis, $knowledge);
                    break;

                case 'doctor_info':
                    Log::info('Handling doctor_info query');
                    $response['response'] = $this->handleDoctorInfo($analysis);
                    break;

                case 'doctor_availability':
                    Log::info('Handling doctor_availability query');
                    $response['response'] = $this->handleDoctorAvailability($analysis);
                    break;

                case 'doctor_recommendation':
                    Log::info('Handling doctor_recommendation query');
                    $response['response'] = $this->handleDoctorRecommendation($analysis, $knowledge);
                    break;

                case 'medical_advice':
                    Log::info('Handling medical_advice query');
                    $response['response'] = $this->handleMedicalAdvice($analysis, $knowledge);
                    break;

                default:
                    Log::info('Handling general query');
                    $response['response'] = $this->handleGeneralQuery($analysis, $knowledge);
                    break;
            }

            // Add disclaimer and emergency info if needed
            $response['response'] = $this->addSafetyInfo($response['response'], $analysis);

            // Cache the response for future similar queries
            $this->knowledgeService->cacheQuestionAnswer(
                $query,
                $response['response']['answer'],
                [
                    'type' => $analysis['type'],
                    'urgency' => $analysis['urgency'],
                    'specializations' => $analysis['possible_specializations'],
                    'symptoms' => $analysis['extracted_symptoms']
                ]
            );

            return $response;

        } catch (\Exception $e) {
            Log::error('AI Recommendation Error: ' . $e->getMessage());
            Log::error('AI Recommendation Error Trace: ' . $e->getTraceAsString());

            return [
                'success' => false,
                'error' => 'Unable to process your request. Please try again.',
                'debug_info' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ] : null,
                'response' => [
                    'answer' => 'I apologize, but I encountered an error processing your request. ' . (config('app.debug') ? $e->getMessage() : ''),
                    'type' => 'error',
                    'suggested_actions' => ['Please try rephrasing your question or contact support.']
                ]
            ];
        }
    }

    private function handleDoctorInfo(array $analysis): array
    {
        $doctorName = $this->extractDoctorName($analysis['query']);

        \Log::info('Extracted doctor name: ' . $doctorName);

        if (!$doctorName) {
            return [
                'answer' => 'I\'m not sure which doctor you\'re asking about. Could you please specify the doctor\'s name?',
                'type' => 'clarification_needed',
                'suggested_actions' => ['Try asking about a specific doctor like "Tell me about Dr. Ahmed Taha"']
            ];
        }

        // Get detailed doctor info from knowledge base
        $doctorInfo = $this->knowledgeService->getDoctorInfo($doctorName);

        \Log::info('Doctor info result', ['doctorInfo' => $doctorInfo]);

        if (!$doctorInfo) {
            // Try to find doctors with similar names in database
            $similarDoctors = \App\Models\User::where('role', 'doctor')
                ->whereHas('doctor', function($query) {
                    $query->where('is_approved', true);
                })
                ->where('name', 'like', '%' . $doctorName . '%')
                ->with('doctor.specialization')
                ->limit(5)
                ->get();

            if ($similarDoctors->count() > 0) {
                $searchResults = $similarDoctors->map(function($user) {
                    return [
                        'name' => $user->name,
                        'specialization' => $user->doctor->specialization->name ?? 'General Practice'
                    ];
                })->toArray();

                $answer = "I found doctors matching '$doctorName':\n\n";
                foreach ($searchResults as $result) {
                    $answer .= "**{$result['name']}**";
                    if (isset($result['specialization'])) {
                        $answer .= " - {$result['specialization']}";
                    }
                    $answer .= "\n";
                }
                $answer .= "\nPlease specify which doctor you'd like to know more about.";

                return [
                    'answer' => $answer,
                    'type' => 'multiple_doctors_found',
                    'data' => $searchResults,
                    'suggested_actions' => array_map(function($doc) {
                        return 'Tell me about ' . $doc['name'];
                    }, $searchResults)
                ];
            }

            // Format doctor name (avoid double "Dr." prefix)
            $displayName = strpos($doctorName, 'Dr.') === 0 ? $doctorName : 'Dr. ' . $doctorName;

            return [
                'answer' => "I couldn't find information about $displayName. They might not be in our current doctor database.",
                'type' => 'doctor_not_found',
                'suggested_actions' => ['Check our list of available doctors', 'Contact support for more information']
            ];
        }

        // Build comprehensive doctor information response
        $fullName = $doctorInfo['full_name'] ?? 'Unknown Doctor';
        // Remove "Dr." prefix if it already exists in fullName
        $displayName = strpos($fullName, 'Dr.') === 0 ? $fullName : "Dr. {$fullName}";
        $answer = "**{$displayName}**\n\n";

        if (isset($doctorInfo['email'])) {
            $answer .= "**Email**: {$doctorInfo['email']}\n";
        }

        if (isset($doctorInfo['phone'])) {
            $answer .= "**Phone**: {$doctorInfo['phone']}\n";
        }

        if (isset($doctorInfo['date_of_birth'])) {
            $answer .= "**Date of Birth**: {$doctorInfo['date_of_birth']}\n";
        }

        if (isset($doctorInfo['address'])) {
            $answer .= "**Address**: {$doctorInfo['address']}\n";
        }

        $answer .= "\n**Professional Information**\n";

        if (isset($doctorInfo['specialization'])) {
            $answer .= "**Specialization**: {$doctorInfo['specialization']}\n";
        }

        if (isset($doctorInfo['license_number'])) {
            $answer .= "**License Number**: {$doctorInfo['license_number']}\n";
        }

        if (isset($doctorInfo['experience'])) {
            $answer .= "**Experience**: {$doctorInfo['experience']}\n";
        }

        if (isset($doctorInfo['consultation_fee'])) {
            $answer .= "**Consultation Fee**: {$doctorInfo['consultation_fee']}\n";
        }

        if (isset($doctorInfo['rating'])) {
            $answer .= "**Rating**: {$doctorInfo['rating']}\n";
        }

        if (isset($doctorInfo['status'])) {
            $answer .= "**Status**: {$doctorInfo['status']}\n";
        }

        if (isset($doctorInfo['biography'])) {
            $answer .= "\n**Biography**\n{$doctorInfo['biography']}\n";
        }

        if (isset($doctorInfo['key_expertise'])) {
            $answer .= "\n**Key Expertise**\n{$doctorInfo['key_expertise']}\n";
        }

        // Format doctor name for suggestions (avoid double "Dr." prefix)
        $displayName = $doctorInfo['full_name'] ?? $doctorName;
        $displayNameForSuggestions = strpos($displayName, 'Dr.') === 0 ? $displayName : 'Dr. ' . $displayName;

        return [
            'answer' => $answer,
            'type' => 'doctor_info',
            'data' => $doctorInfo,
            'suggested_actions' => [
                'Book appointment with ' . $displayNameForSuggestions,
                'View doctor profile',
                'Contact ' . $displayNameForSuggestions
            ]
        ];
    }

    private function handleDoctorAvailability(array $analysis): array
    {
        $doctorName = $this->extractDoctorName($analysis['query']);

        if (!$doctorName) {
            return [
                'answer' => 'I need to know which doctor\'s availability you\'re asking about. Could you please specify the doctor\'s name?',
                'type' => 'clarification_needed',
                'suggested_actions' => ['Tell me the doctor\'s name first', 'Ask "When is Dr. Ahmed Taha available?"']
            ];
        }

        // Find the doctor
        $doctor = \App\Models\Doctor::with(['user', 'schedules'])
            ->whereHas('user', function($query) use ($doctorName) {
                $query->where('name', 'like', '%' . $doctorName . '%');
            })
            ->where('is_approved', true)
            ->first();

        if (!$doctor) {
            return [
                'answer' => "I couldn't find a doctor named '$doctorName' in our system.",
                'type' => 'doctor_not_found',
                'suggested_actions' => ['Check doctor name spelling', 'Ask about a different doctor']
            ];
        }

        $schedules = $doctor->schedules()->available()->orderBy('day_of_week')->orderBy('start_time')->get();

        if ($schedules->isEmpty()) {
            return [
                'answer' => "Dr. {$doctor->user->name} doesn't have any scheduled availability at the moment. Please contact our clinic for more information.",
                'type' => 'no_availability',
                'suggested_actions' => ['Contact clinic directly', 'Ask about another doctor']
            ];
        }

        $displayName = strpos($doctor->user->name, 'Dr.') === 0 ? $doctor->user->name : 'Dr. ' . $doctor->user->name;
        $answer = "**{$displayName} - Weekly Schedule**\n\n";

        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $scheduleByDay = [];

        foreach ($schedules as $schedule) {
            $dayName = $days[$schedule->day_of_week];
            if (!isset($scheduleByDay[$dayName])) {
                $scheduleByDay[$dayName] = [];
            }
            $scheduleByDay[$dayName][] = $schedule->start_time . ' - ' . $schedule->end_time;
        }

        foreach ($days as $dayName) {
            if (isset($scheduleByDay[$dayName])) {
                $answer .= "**{$dayName}**: " . implode(', ', $scheduleByDay[$dayName]) . "\n";
            } else {
                $answer .= "**{$dayName}**: Not available\n";
            }
        }

        // Check for holidays
        $holidays = $doctor->holidays()->where('holiday_date', '>=', now()->toDateString())->orderBy('holiday_date')->limit(3)->get();
        if ($holidays->count() > 0) {
            $answer .= "\n**Upcoming Days Off:**\n";
            foreach ($holidays as $holiday) {
                $answer .= "• " . $holiday->date->format('M j, Y') . " - " . ($holiday->reason ?? 'Holiday') . "\n";
            }
        }

        return [
            'answer' => $answer,
            'type' => 'doctor_availability',
            'data' => [
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->user->name,
                'schedules' => $schedules->map(function($schedule) {
                    return [
                        'day_of_week' => $schedule->day_of_week,
                        'day_name' => $schedule->day_name,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time
                    ];
                })->toArray(),
                'holidays' => $holidays->toArray()
            ],
            'suggested_actions' => [
                'Book appointment with ' . $displayName,
                'Check current availability',
                'View doctor profile'
            ]
        ];
    }

    private function handleSpecializationInfo(array $analysis, array $knowledge = []): array
    {
        $specializationName = $this->extractSpecializationName($analysis['query']);

        if (!$specializationName) {
            return [
                'answer' => 'I\'m not sure which specialization you\'re asking about. Could you please specify?',
                'type' => 'clarification_needed',
                'suggested_actions' => ['Try asking about a specific medical specialty like "Cardiology" or "Dermatology"']
            ];
        }

        // Get specialization info from database
        $specialization = \App\Models\Specialization::where('name', 'like', '%' . $specializationName . '%')->first();

        if (!$specialization) {
            return [
                'answer' => "I couldn't find information about '$specializationName'. We might not have that specialty in our system.",
                'type' => 'specialization_not_found',
                'suggested_actions' => ['Check our list of available specializations', 'Contact support for more information']
            ];
        }

        // Get available doctors for this specialization
        $availableDoctors = \App\Models\Doctor::with(['user', 'specialization'])
            ->where('specialization_id', $specialization->id)
            ->where('is_approved', true)
            ->get();

        $answer = "**{$specialization->name}**\n\n";
        $answer .= "**Description**: {$specialization->description}\n";

        if ($specialization->common_conditions) {
            $answer .= "**Common Conditions**: {$specialization->common_conditions}\n";
        }

        if ($specialization->procedures) {
            $answer .= "**Common Procedures**: {$specialization->procedures}\n";
        }

        if ($specialization->when_to_see) {
            $answer .= "**When to See This Specialist**: {$specialization->when_to_see}\n";
        }

        if ($specialization->emergency_signs) {
            $answer .= "**Emergency Signs**: {$specialization->emergency_signs}\n";
        }

        $answer .= "\n**Available Doctors**: {$availableDoctors->count()} specialists\n";

        if ($availableDoctors->count() > 0) {
            $answer .= "\n**Our {$specialization->name} Specialists:**\n";
            foreach ($availableDoctors as $doctor) {
                $answer .= "• Dr. {$doctor->user->name} - {$doctor->experience_years} years experience, Rating: {$doctor->rating}/5";
                if ($doctor->consultation_fee) {
                    $answer .= ", Fee: \${$doctor->consultation_fee}";
                }
                $answer .= "\n";
            }

            if ($specialization->avg_cost) {
                $answer .= "\nAverage consultation fee: $" . number_format($specialization->avg_cost, 2);
            }
        }

        return [
            'answer' => $answer,
            'type' => 'specialization_info',
            'data' => [
                'id' => $specialization->id,
                'name' => $specialization->name,
                'description' => $specialization->description,
                'common_conditions' => $specialization->common_conditions,
                'procedures' => $specialization->procedures,
                'when_to_see' => $specialization->when_to_see,
                'emergency_signs' => $specialization->emergency_signs,
                'doctors_count' => $availableDoctors->count(),
                'available_doctors' => $availableDoctors->map(function($doctor) {
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->user->name,
                        'experience_years' => $doctor->experience_years,
                        'rating' => $doctor->rating,
                        'consultation_fee' => $doctor->consultation_fee
                    ];
                })->toArray()
            ],
            'suggested_actions' => [
                'Book appointment with a ' . $specialization->name . ' specialist',
                'Learn more about our ' . $specialization->name . ' services',
                'Compare different doctors'
            ]
        ];
    }

    private function handleDoctorRecommendation(array $analysis, array $knowledge = []): array
    {
        if (empty($analysis['extracted_symptoms'])) {
            return [
                'answer' => 'To recommend the best doctor, please tell me about your symptoms or health concern.',
                'type' => 'clarification_needed',
                'suggested_actions' => ['Describe your symptoms', 'Mention which body part is affected', 'Tell me about your medical concern']
            ];
        }

        $recommendations = $this->specializationMatcher->findDoctorsForSymptoms(
            $analysis['extracted_symptoms'],
            $analysis['possible_specializations']
        );

        if (empty($recommendations)) {
            return [
                'answer' => 'Based on your symptoms, I recommend visiting a General Practice doctor first for proper diagnosis.',
                'type' => 'general_recommendation',
                'suggested_actions' => ['Book appointment with General Practice', 'Describe your symptoms in more detail']
            ];
        }

        $answer = "Based on your symptoms (" . implode(', ', $analysis['extracted_symptoms']) . "), here are my recommendations:\n\n";

        foreach ($recommendations as $index => $rec) {
            $doctor = $rec['doctor'];
            $displayName = strpos($doctor['name'], 'Dr.') === 0 ? $doctor['name'] : 'Dr. ' . $doctor['name'];
            $answer .= ($index + 1) . ". **{$displayName}** - {$doctor['specialization']}\n";
            $answer .= "   Experience: {$doctor['experience_years']} years | Rating: {$doctor['rating']}/5 | Fee: \${$doctor['consultation_fee']}\n";
            $answer .= "   Reason: {$doctor['match_reason']}\n\n";
        }

        return [
            'answer' => $answer,
            'type' => 'doctor_recommendation',
            'data' => [
                'recommended_doctors' => array_column($recommendations, 'doctor'),
                'primary_specialization' => isset($recommendations[0]['doctor']['specialization']) ? $recommendations[0]['doctor']['specialization'] : null
            ],
            'suggested_actions' => [
                'Book appointment with the top recommendation',
                'View doctor profiles',
                'Compare availability and fees'
            ]
        ];
    }

    private function handleMedicalAdvice(array $analysis, array $knowledge = []): array
    {
        if (empty($analysis['extracted_symptoms'])) {
            return [
                'answer' => 'I understand you have a health concern. Please describe your symptoms so I can help you better.',
                'type' => 'clarification_needed',
                'suggested_actions' => ['Describe what you\'re feeling', 'Mention how long you\'ve had symptoms', 'Note any other health conditions']
            ];
        }

        $recommendations = $this->specializationMatcher->findDoctorsForSymptoms(
            $analysis['extracted_symptoms'],
            $analysis['possible_specializations']
        );

        $answer = "I understand you're experiencing " . implode(', ', $analysis['extracted_symptoms']) . ".\n\n";

        // Add relevant knowledge from RAG system
        if (!empty($knowledge)) {
            $answer .= "**Based on medical records and knowledge:**\n";
            foreach (array_slice($knowledge, 0, 3) as $fact) {
                $answer .= "• {$fact}\n";
            }
            $answer .= "\n";
        }

        if (!empty($recommendations)) {
            $doctorName = $recommendations[0]['doctor']['name'];
            $displayName = strpos($doctorName, 'Dr.') === 0 ? $doctorName : 'Dr. ' . $doctorName;

            $answer .= "Based on your symptoms, I recommend consulting with a **{$recommendations[0]['doctor']['specialization']}** specialist.\n\n";
            $answer .= "**Top Recommendation:**\n";
            $answer .= "• {$displayName} - {$recommendations[0]['doctor']['experience_years']} years experience\n";
            $answer .= "• Rating: {$recommendations[0]['doctor']['rating']}/5\n";
            $answer .= "• Consultation fee: \${$recommendations[0]['doctor']['consultation_fee']}\n\n";

            $actions = [
                'Book an appointment with ' . $displayName,
                'View complete doctor profile',
                'Check available appointment slots'
            ];
        } else {
            // No specialist doctors found, recommend General Practice
            $generalPracticeDoctors = \App\Models\Doctor::with(['user', 'specialization'])
                ->whereHas('specialization', function($query) {
                    $query->where('name', 'General Practice');
                })
                ->where('is_approved', true)
                ->orderBy('rating', 'desc')
                ->limit(2)
                ->get();

            if ($generalPracticeDoctors->count() > 0) {
                $answer .= "For your symptoms, I recommend starting with a **General Practice** doctor for initial evaluation.\n\n";
                $answer .= "**Recommended General Practice Doctors:**\n";

                foreach ($generalPracticeDoctors as $gpDoctor) {
                    $displayName = strpos($gpDoctor->user->name, 'Dr.') === 0 ? $gpDoctor->user->name : 'Dr. ' . $gpDoctor->user->name;
                    $answer .= "• {$displayName} - Rating: {$gpDoctor->rating}/5\n";
                }
                $answer .= "\n";

                $actions = [
                    'Book appointment with General Practice',
                    'Contact our medical helpline',
                    'Schedule initial consultation'
                ];
            } else {
                $answer .= "I recommend visiting a healthcare professional for proper evaluation of your symptoms. Please contact our clinic for assistance.\n\n";
                $actions = ['Contact clinic directly', 'Call medical helpline'];
            }
        }

        // Add self-care tips based on symptoms
        $answer .= $this->addSelfCareTips($analysis['extracted_symptoms']);

        return [
            'answer' => $answer,
            'type' => 'medical_advice',
            'data' => !empty($recommendations) ? ['recommended_doctor' => $recommendations[0]['doctor']] : null,
            'suggested_actions' => $actions
        ];
    }

    private function handleGeneralQuery(array $analysis, array $knowledge = []): array
    {
        return [
            'answer' => 'I\'m here to help with medical questions and doctor recommendations. You can ask me about medical specializations, find the right doctor for your symptoms, or get general medical guidance.',
            'type' => 'general_response',
            'suggested_actions' => [
                'Ask about a specific medical specialization',
                'Tell me your symptoms for doctor recommendation',
                'Learn about our available doctors'
            ]
        ];
    }

    private function extractDoctorName(string $query): ?string
    {
        // Look for patterns like "Dr. Ahmed Taha", "Doctor Ahmed Taha", etc.
        $patterns = [
            '/dr\.?\s*([a-z]+\s+[a-z]+)/i',  // Dr. Ahmed Taha
            '/doctor\s+([a-z]+\s+[a-z]+)/i', // Doctor Ahmed Taha
            '/about\s+dr\.?\s*([a-z]+\s+[a-z]+)/i', // about Dr. Ahmed Taha
            '/tell me about\s+dr\.?\s*([a-z]+\s+[a-z]+)/i', // tell me about Dr. Ahmed Taha
            '/who is\s+dr\.?\s*([a-z]+\s+[a-z]+)/i', // who is Dr. Ahmed Taha
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $query, $matches)) {
                return trim($matches[1]);
            }
        }

        // Get doctor names from database
        $doctorNames = \App\Models\User::where('role', 'doctor')
            ->pluck('name')
            ->toArray();

        $queryLower = strtolower($query);

        // Search for exact matches (with and without Dr. prefix)
        foreach ($doctorNames as $doctorName) {
            $doctorNameLower = strtolower($doctorName);
            $doctorNameWithoutDr = strtolower(preg_replace('/^dr\.?\s*/i', '', $doctorName));

            if (stripos($queryLower, $doctorNameLower) !== false ||
                stripos($queryLower, $doctorNameWithoutDr) !== false) {
                return $doctorName; // Return the full name with Dr. prefix
            }
        }

        // Try partial matches for first and last names
        $queryWords = array_filter(explode(' ', $queryLower));
        if (count($queryWords) >= 2) {
            foreach ($doctorNames as $doctorName) {
                $doctorWords = array_filter(explode(' ', strtolower(preg_replace('/^dr\.?\s*/i', '', $doctorName))));
                if (count($doctorWords) >= 2) {
                    // Check if query contains both first and last name from doctor
                    $firstNameMatch = false;
                    $lastNameMatch = false;
                    foreach ($queryWords as $queryWord) {
                        if (stripos($doctorWords[0], $queryWord) !== false || stripos($queryWord, $doctorWords[0]) !== false) {
                            $firstNameMatch = true;
                        }
                        if (count($doctorWords) > 1 && (stripos($doctorWords[1], $queryWord) !== false || stripos($queryWord, $doctorWords[1]) !== false)) {
                            $lastNameMatch = true;
                        }
                    }
                    if ($firstNameMatch && $lastNameMatch) {
                        return $doctorName;
                    }
                }
            }
        }

        // Try single name matches (first or last name only)
        foreach ($queryWords as $queryWord) {
            foreach ($doctorNames as $doctorName) {
                $doctorWords = array_filter(explode(' ', strtolower(preg_replace('/^dr\.?\s*/i', '', $doctorName))));
                foreach ($doctorWords as $doctorWord) {
                    if (stripos($doctorWord, $queryWord) !== false || stripos($queryWord, $doctorWord) !== false) {
                        // Check if this is a unique match
                        $matches = [];
                        foreach ($doctorNames as $checkName) {
                            $checkWords = array_filter(explode(' ', strtolower(preg_replace('/^dr\.?\s*/i', '', $checkName))));
                            if (in_array($doctorWord, $checkWords)) {
                                $matches[] = $checkName;
                            }
                        }
                        if (count($matches) === 1) {
                            return $matches[0];
                        }
                    }
                }
            }
        }

        return null;
    }

    private function extractSpecializationName(string $query): ?string
    {
        $specializations = Specialization::pluck('name')->toArray();

        foreach ($specializations as $spec) {
            if (stripos($query, strtolower($spec)) !== false) {
                return $spec;
            }
        }

        // Try to extract from common patterns
        if (preg_match('/about ([\w\s]+)/i', $query, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    private function addSelfCareTips(array $symptoms): string
    {
        $tips = [];

        foreach ($symptoms as $symptom) {
            switch ($symptom) {
                case 'eye':
                case 'vision':
                    $tips[] = "• Rest your eyes every 20 minutes if using screens";
                    $tips[] = "• Use artificial tears if eyes feel dry";
                    break;
                case 'stomach':
                    $tips[] = "• Drink plenty of water and eat bland foods";
                    $tips[] = "• Avoid spicy, fatty, or fried foods";
                    break;
                case 'headache':
                    $tips[] = "• Rest in a quiet, dark room";
                    $tips[] = "• Stay hydrated and avoid caffeine";
                    break;
                case 'fever':
                    $tips[] = "• Stay hydrated and rest";
                    $tips[] = "• Monitor temperature regularly";
                    break;
            }
        }

        if (!empty($tips)) {
            return "**While waiting for your appointment:**\n" . implode("\n", array_unique($tips)) . "\n\n";
        }

        return '';
    }

    private function addSafetyInfo(array $response, array $analysis): array
    {
        if ($analysis['is_emergency']) {
            $response['answer'] = "**EMERGENCY ALERT**\n\n" . $response['answer'];
            $response['answer'] .= "\n\n**⚠️ Based on your description, this may be a medical emergency.**\n";
            $response['answer'] .= "Please go to the nearest emergency room or call emergency services immediately.";

            if (!in_array('Call emergency services', $response['suggested_actions'])) {
                array_unshift($response['suggested_actions'], 'Call emergency services (911/999)');
            }
        }

        $response['disclaimer'] = 'This information is for educational purposes only and not medical advice. Always consult with a healthcare professional for proper diagnosis and treatment.';

        return $response;
    }
}
