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
            // Try to search for similar doctor names
            $searchResults = $this->knowledgeService->searchDoctors($doctorName);

            if (!empty($searchResults)) {
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

            return [
                'answer' => "I couldn't find information about Dr. $doctorName. They might not be in our current doctor database.",
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

        return [
            'answer' => $answer,
            'type' => 'doctor_info',
            'data' => $doctorInfo,
            'suggested_actions' => [
                'Book appointment with Dr. ' . ($doctorInfo['full_name'] ?? $doctorName),
                'View doctor profile',
                'Contact Dr. ' . ($doctorInfo['full_name'] ?? $doctorName)
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

        // First try to get info from knowledge base
        $kbInfo = $this->knowledgeService->getSpecializationInfo($specializationName);

        if ($kbInfo) {
            $answer = "**{$specializationName}**\n\n";
            $answer .= "**Description**: " . (isset($kbInfo['description']) ? $kbInfo['description'] : 'Medical specialization') . "\n";

            if (isset($kbInfo['common_conditions'])) {
                $answer .= "**Common Conditions**: {$kbInfo['common_conditions']}\n";
            }

            if (isset($kbInfo['procedures'])) {
                $answer .= "**Common Procedures**: {$kbInfo['procedures']}\n";
            }

            if (isset($kbInfo['when_to_see'])) {
                $answer .= "**When to See This Specialist**: {$kbInfo['when_to_see']}\n";
            }

            if (isset($kbInfo['available_doctors'])) {
                $answer .= "**Available Doctors**: {$kbInfo['available_doctors']}\n";
            }

            return [
                'answer' => $answer,
                'type' => 'specialization_info',
                'data' => $kbInfo,
                'suggested_actions' => [
                    'Book appointment with a ' . $specializationName . ' specialist',
                    'Learn more about our ' . $specializationName . ' services'
                ]
            ];
        }

        // Fallback to database info
        $info = $this->specializationMatcher->findSpecializationInfo($specializationName);

        if (!$info) {
            return [
                'answer' => "I couldn't find information about '$specializationName'. We might not have that specialty in our system.",
                'type' => 'specialization_not_found',
                'suggested_actions' => ['Check our list of available specializations', 'Contact support for more information']
            ];
        }

        $answer = "**{$info['name']}**\n\n";
        $answer .= "{$info['description']}\n\n";
        $answer .= "We have **{$info['doctors_count']}** {$info['name']} specialists in our system.\n\n";

        if ($info['doctors_count'] > 0) {
            $answer .= "**Top Doctors in {$info['name']}:**\n";
            foreach ($info['top_doctors'] as $doctor) {
                $answer .= "• Dr. {$doctor['name']} - {$doctor['experience_years']} years experience, Rating: {$doctor['rating']}/5\n";
            }
            $answer .= "\nAverage consultation fee: $" . number_format($info['average_fee'], 2);
        }

        return [
            'answer' => $answer,
            'type' => 'specialization_info',
            'data' => $info,
            'suggested_actions' => [
                'Book appointment with a ' . $info['name'] . ' specialist',
                'Learn more about our ' . $info['name'] . ' services',
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
            $answer .= ($index + 1) . ". **Dr. {$doctor['name']}** - {$doctor['specialization']}\n";
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
            $answer .= "Based on your symptoms, I recommend consulting with a **{$recommendations[0]['doctor']['specialization']}** specialist.\n\n";
            $answer .= "**Top Recommendation:**\n";
            $answer .= "• Dr. {$recommendations[0]['doctor']['name']} - {$recommendations[0]['doctor']['experience_years']} years experience\n";
            $answer .= "• Rating: {$recommendations[0]['doctor']['rating']}/5\n";
            $answer .= "• Consultation fee: \${$recommendations[0]['doctor']['consultation_fee']}\n\n";

            $actions = [
                'Book an appointment with Dr. ' . $recommendations[0]['doctor']['name'],
                'View complete doctor profile',
                'Check available appointment slots'
            ];
        } else {
            $answer .= "I recommend visiting a **General Practice** doctor for proper evaluation of your symptoms.\n\n";
            $actions = ['Book appointment with General Practice', 'Contact our medical helpline'];
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

        // Try to extract from doctor names in our knowledge base
        $doctorNames = [
            'Ahmed Taha', 'Aya Basheer', 'Tasneem Gaballah', 'Islam Ghanem',
            'Mohamed Hassan', 'Sara Ali', 'Omar Khaled',
            'ahmed taha', 'aya basheer', 'tasneem gaballah', 'islam ghanem',
            'mohamed hassan', 'sara ali', 'omar khaled'
        ];

        foreach ($doctorNames as $doctorName) {
            if (stripos($query, $doctorName) !== false) {
                return $doctorName;
            }
        }

        // Try partial matches for first names
        $firstNames = ['ahmed', 'aya', 'tasneem', 'islam', 'mohamed', 'sara', 'omar'];
        foreach ($firstNames as $firstName) {
            if (stripos($query, $firstName) !== false) {
                // Return the first matching doctor with this first name
                foreach ($doctorNames as $fullName) {
                    if (stripos($fullName, $firstName) === 0) {
                        return $fullName;
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
