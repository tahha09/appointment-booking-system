<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\MedicalQueryAnalyzerService;

$query = "tell me about dr. ahmed taha";

echo "Testing query: '$query'\n\n";

// Test query analyzer
$analyzer = new MedicalQueryAnalyzerService();
$analysis = $analyzer->analyze($query);

echo "=== Query Analysis ===\n";
echo "Query: " . $analysis['query'] . "\n";
echo "Type: " . $analysis['type'] . "\n";
echo "Urgency: " . $analysis['urgency'] . "\n";
echo "Symptoms: " . implode(', ', $analysis['extracted_symptoms']) . "\n";
echo "Specializations: " . implode(', ', $analysis['possible_specializations']) . "\n";
echo "Is Emergency: " . ($analysis['is_emergency'] ? 'Yes' : 'No') . "\n\n";

// Test doctor name extraction (simulate what happens in DoctorRecommendationService)
echo "=== Doctor Name Extraction Test ===\n";

// Look for patterns like "Dr. Ahmed Taha", "Doctor Ahmed Taha", etc.
$patterns = [
    '/dr\.?\s*([a-z]+\s+[a-z]+)/i',  // Dr. Ahmed Taha
    '/doctor\s+([a-z]+\s+[a-z]+)/i', // Doctor Ahmed Taha
    '/about\s+dr\.?\s*([a-z]+\s+[a-z]+)/i', // about Dr. Ahmed Taha
    '/tell me about\s+dr\.?\s*([a-z]+\s+[a-z]+)/i', // tell me about Dr. Ahmed Taha
    '/who is\s+dr\.?\s*([a-z]+\s+[a-z]+)/i', // who is Dr. Ahmed Taha
];

$extractedDoctor = null;
foreach ($patterns as $pattern) {
    if (preg_match($pattern, $query, $matches)) {
        $extractedDoctor = trim($matches[1]);
        echo "Pattern matched: $pattern\n";
        echo "Extracted doctor: $extractedDoctor\n";
        break;
    }
}

// Try to extract from doctor names in our knowledge base
if (!$extractedDoctor) {
    $doctorNames = [
        'Ahmed Taha', 'Aya Basheer', 'Tasneem Gaballah', 'Islam Ghanem',
        'Mohamed Hassan', 'Sara Ali', 'Omar Khaled',
        'ahmed taha', 'aya basheer', 'tasneem gaballah', 'islam ghanem',
        'mohamed hassan', 'sara ali', 'omar khaled'
    ];

    foreach ($doctorNames as $doctorName) {
        if (stripos($query, $doctorName) !== false) {
            $extractedDoctor = $doctorName;
            echo "Found doctor name in query: $doctorName\n";
            break;
        }
    }
}

// Try partial matches for first names
if (!$extractedDoctor) {
    $firstNames = ['ahmed', 'aya', 'tasneem', 'islam', 'mohamed', 'sara', 'omar'];
    foreach ($firstNames as $firstName) {
        if (stripos($query, $firstName) !== false) {
            // Return the first matching doctor with this first name
            $doctorNames = [
                'Ahmed Taha', 'Aya Basheer', 'Tasneem Gaballah', 'Islam Ghanem',
                'Mohamed Hassan', 'Sara Ali', 'Omar Khaled'
            ];
            foreach ($doctorNames as $fullName) {
                if (stripos($fullName, $firstName) === 0) {
                    $extractedDoctor = $fullName;
                    echo "Found partial match for first name: $firstName -> $fullName\n";
                    break 2;
                }
            }
        }
    }
}

echo "Final extracted doctor name: " . ($extractedDoctor ?? 'None') . "\n\n";

echo "=== Test Complete ===\n";
