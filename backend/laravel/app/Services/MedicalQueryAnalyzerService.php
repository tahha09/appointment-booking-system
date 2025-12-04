<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MedicalQueryAnalyzerService
{
    private $symptomMapping = [
        'eye' => ['Ophthalmology'],
        'vision' => ['Ophthalmology'],
        'see' => ['Ophthalmology'],
        'sight' => ['Ophthalmology'],
        'stomach' => ['General Practice'],
        'abdominal' => ['General Practice'],
        'stomach pain' => ['General Practice'],
        'heart' => ['Cardiology'],
        'chest' => ['Cardiology'],
        'cardi' => ['Cardiology'],
        'skin' => ['Dermatology'],
        'rash' => ['Dermatology'],
        'acne' => ['Dermatology'],
        'head' => ['Neurology'],
        'headache' => ['Neurology'],
        'brain' => ['Neurology'],
        'nerve' => ['Neurology'],
        'child' => ['Pediatrics'],
        'baby' => ['Pediatrics'],
        'kids' => ['Pediatrics'],
        'bone' => ['Orthopedics'],
        'joint' => ['Orthopedics'],
        'muscle' => ['Orthopedics'],
        'women' => ['Gynecology'],
        'female' => ['Gynecology'],
        'period' => ['Gynecology'],
        'pregnancy' => ['Gynecology'],
        'teeth' => ['Dentistry'],
        'tooth' => ['Dentistry'],
        'dental' => ['Dentistry'],
        'mental' => ['Psychiatry'],
        'anxiety' => ['Psychiatry'],
        'depress' => ['Psychiatry'],
        'stress' => ['Psychiatry'],
        'general' => ['General Practice'],
        'fever' => ['General Practice'],
        'cold' => ['General Practice'],
        'flu' => ['General Practice'],
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
        if (preg_match('/dr\.?\s+[a-z]+/i', $query) && (
            preg_match('/tell me about/i', $query) ||
            preg_match('/who is/i', $query) ||
            preg_match('/information about/i', $query) ||
            preg_match('/details about/i', $query) ||
            preg_match('/specialization|experience|fee/i', $query)
        )) {
            return 'doctor_info';
        }

        // Check for doctor recommendation queries (should come before specialization)
        if (preg_match('/best doctor|should i visit|which doctor|recommend a doctor/i', $query)) {
            return 'doctor_recommendation';
        }

        // Check for specialization queries
        if (preg_match('/tell me about|what is|explain|information about/i', $query)) {
            return 'specialization_info';
        }

        if (preg_match('/what should i do|i have|i feel|symptom|pain|problem/i', $query)) {
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
}
