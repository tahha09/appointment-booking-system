<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Services\DoctorRecommendationService;
use App\Services\ChatSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedicalAssistantController extends Controller
{
    private $recommendationService;
    private $chatSessionService;

    public function __construct(
        DoctorRecommendationService $recommendationService
    ) {
        $this->recommendationService = $recommendationService;
        $this->chatSessionService = app(ChatSessionService::class);
    }

    public function ask(Request $request)
    {
        \Log::info('AI Ask Request', ['data' => $request->all()]);
        try {
            $validator = Validator::make($request->all(), [
                'query' => 'required|string|min:3|max:500',
                'user_type' => 'nullable|in:patient,guest,doctor,admin',
                'session_id' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                \Log::warning('AI Ask Validation Failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => [
                    'answer' => 'Validation error: ' . $e->getMessage(),
                    'type' => 'error'
                ]
            ], 500);
        }

        try {
            $query = trim($request->input('query'));
            $userType = $request->input('user_type', 'guest');
            $sessionId = $request->input('session_id');

            // Get or create session
            $sessionId = $this->chatSessionService->getOrCreateSession($sessionId);

            // For now, skip session similarity check to avoid potential issues
            // $similarQuestion = $this->chatSessionService->findSimilarQuestionInSession($sessionId, $query);

            // Process the query with AI service
            $result = $this->recommendationService->getRecommendations($query);

            // Save messages to session
            $this->chatSessionService->saveMessage($sessionId, [
                'content' => $query,
                'is_user' => true
            ]);

            if ($result['success']) {
                $this->chatSessionService->saveMessage($sessionId, [
                    'content' => $result['response']['answer'],
                    'is_user' => false,
                    'suggested_actions' => $result['response']['suggested_actions'] ?? null,
                    'type' => $result['response']['type'] ?? 'response'
                ]);
            }

            // Transfer session to user if authenticated and not already done
            if (auth()->check() && !session()->has('medical_chat_transferred')) {
                $this->chatSessionService->transferToUser($sessionId, auth()->id());
                session()->put('medical_chat_transferred', true);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => [
                    'answer' => 'Sorry, there was an internal server error. Please try again later.',
                    'type' => 'error',
                    'debug' => config('app.debug') ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : null,
                    'trace' => config('app.debug') ? $e->getTraceAsString() : null
                ],
                'session_id' => $sessionId ?? null,
                'timestamp' => now()->toDateTimeString()
            ], 500);
        }

        // Ensure consistent response structure
        $responseData = [
            'success' => $result['success'] ?? false,
            'data' => null,
            'analysis' => null,
            'session_id' => $sessionId,
            'timestamp' => now()->toDateTimeString()
        ];

        if ($result['success'] && isset($result['response'])) {
            $responseData['data'] = $result['response'];
            $responseData['analysis'] = $result['analysis'] ?? null;
        } else {
            $responseData['data'] = [
                'answer' => $result['error'] ?? 'Unable to process your request. Please try again.',
                'type' => 'error',
                'suggested_actions' => ['Try rephrasing your question']
            ];
        }

        return response()->json($responseData);
    }

    public function getHistory(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $sessionId = $request->input('session_id');

            // Get messages from session
            $messages = $this->chatSessionService->getMessages($sessionId);

            // If user is authenticated, also get their permanent history
            if (auth()->check()) {
                $userHistory = $this->chatSessionService->getUserHistory(auth()->id());
                if (!empty($userHistory)) {
                    $messages = array_merge($userHistory, $messages);
                }
            }

            // Sort by timestamp and limit to recent messages
            usort($messages, fn($a, $b) => strtotime($a['timestamp']) - strtotime($b['timestamp']));
            $messages = array_slice($messages, -50); // Last 50 messages

            return response()->json([
                'success' => true,
                'messages' => $messages,
                'stats' => $this->chatSessionService->getSessionStats($sessionId)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'messages' => [],
                'stats' => ['total_messages' => 0],
                'error' => config('app.debug') ? $e->getMessage() : 'Unable to load chat history'
            ], 500);
        }
    }

    public function testExamples()
    {
        $examples = [
            [
                'question' => 'Tell me about Gynecology',
                'description' => 'Get information about a medical specialization'
            ],
            [
                'question' => 'What is the best doctor should I visit for my eye?',
                'description' => 'Get doctor recommendations for specific symptoms'
            ],
            [
                'question' => 'I have a problem in my stomach what should I do?',
                'description' => 'Get medical advice and doctor recommendations'
            ],
            [
                'question' => 'Recommend a good dermatologist',
                'description' => 'Find specialists in a specific field'
            ],
            [
                'question' => 'I have severe chest pain',
                'description' => 'Emergency situation detection'
            ]
        ];

        return response()->json([
            'success' => true,
            'examples' => $examples,
            'instructions' => 'Send a POST request to /api/ai/ask with {"query": "your question"}'
        ]);
    }
}
