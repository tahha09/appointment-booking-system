<?php

// Simple test without Laravel autoloading
$knowledgeBasePath = __DIR__ . '/medical_knowledge_base.md';

echo "Testing knowledge base file access...\n\n";
echo "File path: $knowledgeBasePath\n";
echo "File exists: " . (file_exists($knowledgeBasePath) ? 'Yes' : 'No') . "\n\n";

if (file_exists($knowledgeBasePath)) {
    $content = file_get_contents($knowledgeBasePath);
    echo "File size: " . strlen($content) . " characters\n";

    // Test Gynecology lookup
    echo "\n=== Testing Gynecology Lookup ===\n";
    $specializationName = 'Gynecology';
    $pattern = '/### ' . preg_quote(ucfirst($specializationName), '/') . '\s*\n(.*?)(?=\n###|\n##|$)/si';
    echo "Pattern: $pattern\n";
    if (preg_match($pattern, $content, $matches)) {
        echo "Found Gynecology section:\n";
        echo $matches[1] . "\n";
    } else {
        echo "Gynecology section not found\n";
    }

    // Test doctor lookup
    echo "\n=== Testing Doctor Lookup ===\n";
    $pattern = '/### (Dr\..*?)\s*\n(.*?)(?=\n###|\n##|$)/si';
    if (preg_match_all($pattern, $content, $matches, PREG_SET_ORDER)) {
        echo "Found " . count($matches) . " doctors:\n";
        foreach ($matches as $match) {
            echo "- " . $match[1] . "\n";
        }
    }

    // Test specialization parsing manually
    echo "\n=== Testing Specialization Parsing ===\n";
    $specializationName = 'Gynecology';
    $pattern = '/### ' . preg_quote(ucfirst($specializationName), '/') . '\s*\n(.*?)(?=\n###|\n##|$)/si';

    if (preg_match($pattern, $content, $matches)) {
        $specInfo = $matches[1];
        echo "Raw spec info:\n$specInfo\n\n";

        // Parse the specialization information
        $info = [];
        $lines = explode("\n", trim($specInfo));

        echo "Parsing lines:\n";
        foreach ($lines as $line) {
            echo "Line: '$line'\n";
            if (strpos($line, '- **') === 0) {
                $line = substr($line, 3);
                echo "  After substr: '$line'\n";
                if (strpos($line, '**: ') !== false) {
                    list($key, $value) = explode('**: ', $line, 2);
                    $key = str_replace(['**', ':'], '', $key);
                    $info[strtolower(str_replace(' ', '_', $key))] = $value;
                    echo "  Parsed: '$key' => '$value'\n";
                }
            }
        }

        echo "\nFinal parsed info:\n" . json_encode($info, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Specialization not found\n";
    }
} else {
    echo "Knowledge base file not found!\n";
}

echo "\n=== Test Complete ===\n";