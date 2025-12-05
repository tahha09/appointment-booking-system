<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\MedicalKnowledgeService;

// Test the knowledge base
$knowledgeService = new MedicalKnowledgeService();

echo "=== Testing Medical Knowledge Base ===\n\n";

// Test doctor info
echo "1. Testing Doctor Info (Ahmed Taha):\n";
$doctorInfo = $knowledgeService->getDoctorInfo('Ahmed Taha');
if ($doctorInfo) {
    echo "Found doctor: " . ($doctorInfo['full_name'] ?? 'Unknown') . "\n";
    echo "Email: " . ($doctorInfo['email'] ?? 'N/A') . "\n";
    echo "Phone: " . ($doctorInfo['phone'] ?? 'N/A') . "\n";
    echo "Specialization: " . ($doctorInfo['specialization'] ?? 'N/A') . "\n";
} else {
    echo "Doctor not found\n";
}

echo "\n2. Testing Specialization Info (Cardiology):\n";
$specInfo = $knowledgeService->getSpecializationInfo('Cardiology');
if ($specInfo) {
    echo "Found specialization: " . ($specInfo['description'] ?? 'N/A') . "\n";
    echo "Available doctors: " . ($specInfo['available_doctors'] ?? 'N/A') . "\n";
} else {
    echo "Specialization not found\n";
}

echo "\n3. Testing Doctor Search (Ahmed):\n";
$searchResults = $knowledgeService->searchDoctors('Ahmed');
if (!empty($searchResults)) {
    foreach ($searchResults as $result) {
        echo "Found: " . $result['name'] . "\n";
    }
} else {
    echo "No doctors found\n";
}

echo "\n=== Test Complete ===\n";
