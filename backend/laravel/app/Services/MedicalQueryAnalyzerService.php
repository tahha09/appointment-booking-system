<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MedicalQueryAnalyzerService
{
    private $symptomMapping = [
        // Ophthalmology
        'eye' => ['Ophthalmology'],
        'vision' => ['Ophthalmology'],
        'see' => ['Ophthalmology'],
        'sight' => ['Ophthalmology'],
        'eyes' => ['Ophthalmology'],
        'blind' => ['Ophthalmology'],
        'blurry' => ['Ophthalmology'],

        // Cardiology
        'heart' => ['Cardiology'],
        'chest' => ['Cardiology'],
        'cardi' => ['Cardiology'],
        'palpitations' => ['Cardiology'],
        'hypertension' => ['Cardiology'],
        'blood pressure' => ['Cardiology'],

        // Dermatology
        'skin' => ['Dermatology'],
        'rash' => ['Dermatology'],
        'acne' => ['Dermatology'],
        'eczema' => ['Dermatology'],
        'psoriasis' => ['Dermatology'],
        'hair' => ['Dermatology'],
        'nail' => ['Dermatology'],
        'dermatitis' => ['Dermatology'],

        // Neurology
        'head' => ['Neurology'],
        'headache' => ['Neurology'],
        'brain' => ['Neurology'],
        'nerve' => ['Neurology'],
        'migraine' => ['Neurology'],
        'seizure' => ['Neurology'],
        'stroke' => ['Neurology'],
        'dizziness' => ['Neurology'],

        // Pediatrics
        'child' => ['Pediatrics'],
        'baby' => ['Pediatrics'],
        'kids' => ['Pediatrics'],
        'children' => ['Pediatrics'],
        'pediatric' => ['Pediatrics'],
        'infant' => ['Pediatrics'],

        // Orthopedics
        'bone' => ['Orthopedics'],
        'joint' => ['Orthopedics'],
        'muscle' => ['Orthopedics'],
        'fracture' => ['Orthopedics'],
        'broken' => ['Orthopedics'],
        'arthritis' => ['Orthopedics'],
        'back' => ['Orthopedics'],
        'knee' => ['Orthopedics'],
        'shoulder' => ['Orthopedics'],
        'ankle' => ['Orthopedics'],
        'leg' => ['Orthopedics'],
        'foot' => ['Orthopedics'],
        'arm' => ['Orthopedics'],
        'wrist' => ['Orthopedics'],

        // Gynecology
        'women' => ['Gynecology'],
        'female' => ['Gynecology'],
        'period' => ['Gynecology'],
        'pregnancy' => ['Gynecology'],
        'menstrual' => ['Gynecology'],
        'gynecological' => ['Gynecology'],
        'reproductive' => ['Gynecology'],

        // Dentistry
        'teeth' => ['Dentistry'],
        'tooth' => ['Dentistry'],
        'dental' => ['Dentistry'],
        'mouth' => ['Dentistry'],
        'oral' => ['Dentistry'],
        'gum' => ['Dentistry'],

        // Psychiatry
        'mental' => ['Psychiatry'],
        'anxiety' => ['Psychiatry'],
        'depress' => ['Psychiatry'],
        'stress' => ['Psychiatry'],
        'depression' => ['Psychiatry'],
        'bipolar' => ['Psychiatry'],
        'therapy' => ['Psychiatry'],
        'psychological' => ['Psychiatry'],

        // General Practice (fallback)
        'stomach' => ['General Practice'],
        'abdominal' => ['General Practice'],
        'stomach pain' => ['General Practice'],
        'general' => ['General Practice'],
        'fever' => ['General Practice'],
        'cold' => ['General Practice'],
        'flu' => ['General Practice'],
        'cough' => ['General Practice'],
        'sore throat' => ['General Practice'],
        'nausea' => ['General Practice'],
        'vomiting' => ['General Practice'],
    ];

    private $emergencyKeywords = [
        'emergency', 'urgent', 'severe', 'chest pain', 'heart attack',
        'stroke', 'difficulty breathing', 'unconscious', 'bleeding',
        'broken bone', 'burn', 'poison', 'suicide'
    ];

    public function analyze(string $query): array
    {
        $query = strtolower(trim($query));

        return [
            'query' => $query,
            'type' => $this->determineQueryType($query),
            'urgency' => $this->checkUrgency($query),
            'extracted_symptoms' => $this->extractSymptoms($query),
            'possible_specializations' => $this->mapToSpecializations($query),
            'is_emergency' => $this->isEmergency($query)
        ];
    }

    private function determineQueryType(string $query): string
    {
        // Check for doctor queries first (most specific patterns)
        // Look for "dr." prefix with doctor-related phrases
        if (preg_match('/dr\.?\s+[a-z]+/i', $query) && (
            preg_match('/tell me about/i', $query) ||
            preg_match('/who is/i', $query) ||
            preg_match('/information about/i', $query) ||
            preg_match('/details about/i', $query) ||
            preg_match('/specialization|experience|fee/i', $query)
        )) {
            return 'doctor_info';
        }

        // Also check for doctor queries with known doctor names even without "dr." prefix
        if ($this->containsDoctorName($query) && (
            preg_match('/tell me about/i', $query) ||
            preg_match('/who is/i', $query) ||
            preg_match('/information about/i', $query) ||
            preg_match('/details about/i', $query)
        )) {
            return 'doctor_info';
        }

        // Check for doctor recommendation queries (should come before specialization)
        if (preg_match('/best doctor|should i visit|which doctor|recommend a doctor/i', $query)) {
            return 'doctor_recommendation';
        }

        // Check for availability/schedule queries
        if (preg_match('/when.*available|working hours|schedule|days|time|appointment.*time/i', $query) && $this->containsDoctorName($query)) {
            return 'doctor_availability';
        }

        // Check for specialization queries
        if (preg_match('/tell me about|what is|explain|information about/i', $query)) {
            return 'specialization_info';
        }

        if (preg_match('/what should i do|i have|i feel|symptom|pain|problem|injured|injury|hurt|ache|sore/i', $query)) {
            return 'medical_advice';
        }

        return 'general_query';
    }

    private function extractSymptoms(string $query): array
    {
        $symptoms = [];
        foreach ($this->symptomMapping as $keyword => $specializations) {
            if (strpos($query, $keyword) !== false) {
                $symptoms[] = $keyword;
            }
        }
        return array_unique($symptoms);
    }

    private function mapToSpecializations(string $query): array
    {
        $specializations = [];

        foreach ($this->symptomMapping as $keyword => $specs) {
            if (strpos($query, $keyword) !== false) {
                $specializations = array_merge($specializations, $specs);
            }
        }

        // If no specific specialization found, return general practice
        if (empty($specializations)) {
            return ['general_practice'];
        }

        return array_unique($specializations);
    }

    private function checkUrgency(string $query): string
    {
        foreach ($this->emergencyKeywords as $keyword) {
            if (strpos($query, strtolower($keyword)) !== false) {
                return 'emergency';
            }
        }

        if (preg_match('/severe|extreme|terrible|awful|worst/i', $query)) {
            return 'urgent';
        }

        return 'routine';
    }

    private function isEmergency(string $query): bool
    {
        return $this->checkUrgency($query) === 'emergency';
    }

    /**
     * Check if query contains known doctor names
     */
    private function containsDoctorName(string $query): bool
    {
        try {
            // Get doctor names from database
            $doctorNames = \App\Models\User::where('role', 'doctor')
                ->pluck('name')
                ->toArray();

            $queryLower = strtolower($query);

            // Check for exact matches (with and without Dr. prefix)
            foreach ($doctorNames as $doctorName) {
                $doctorNameLower = strtolower($doctorName);
                $doctorNameWithoutDr = strtolower(preg_replace('/^dr\.?\s*/i', '', $doctorName));

                if (stripos($queryLower, $doctorNameLower) !== false ||
                    stripos($queryLower, $doctorNameWithoutDr) !== false) {
                    return true;
                }
            }

            // Check for partial matches (first + last name combinations)
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
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch (\Exception $e) {
            // If database query fails, fall back to basic check
            $basicDoctorNames = ['ahmed taha', 'aya basheer', 'tasneem gaballah', 'islam ghanem', 'mohamed hassan', 'sara ali', 'omar khaled'];
            $queryLower = strtolower($query);
            foreach ($basicDoctorNames as $name) {
                if (stripos($queryLower, $name) !== false) {
                    return true;
                }
            }
            return false;
        }
    }
}
