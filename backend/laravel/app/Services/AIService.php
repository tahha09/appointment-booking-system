<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    private $openaiApiKey;
    private $huggingfaceApiKey;

    public function __construct()
    {
        $this->openaiApiKey = config('services.openai.api_key');
        $this->huggingfaceApiKey = config('services.huggingface.api_key');
    }

    public function enhanceMedicalResponse(string $baseResponse, array $context = []): string
    {
        // This method can be used to enhance responses with AI
        // Currently using rule-based system, can be enhanced with OpenAI later

        return $baseResponse;
    }

    public function generateWithOpenAI(string $prompt, array $options = []): ?string
    {
        if (!$this->openaiApiKey) {
            Log::warning('OpenAI API key not configured');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->openaiApiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => $options['model'] ?? 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a helpful medical assistant. Provide accurate, helpful information.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => $options['max_tokens'] ?? 500,
                'temperature' => $options['temperature'] ?? 0.7,
            ]);

            if ($response->successful()) {
                return $response->json()['choices'][0]['message']['content'] ?? null;
            }

            Log::error('OpenAI API error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('OpenAI API exception: ' . $e->getMessage());
            return null;
        }
    }

    public function getEmbeddingsFromHuggingFace(string $text): ?array
    {
        if (!$this->huggingfaceApiKey) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->huggingfaceApiKey,
            ])->post('https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2', [
                'inputs' => $text,
                'options' => ['wait_for_model' => true]
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return null;

        } catch (\Exception $e) {
            Log::error('HuggingFace API error: ' . $e->getMessage());
            return null;
        }
    }
}
