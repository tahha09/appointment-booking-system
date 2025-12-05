<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;

class ChatSessionService
{
    private $sessionPrefix = 'chat_session_';
    private $cacheDuration = 3600 * 24; // 24 hours

    /**
     * Create or get existing chat session
     */
    public function getOrCreateSession(string $sessionId = null): string
    {
        if (!$sessionId) {
            $sessionId = $this->generateSessionId();
        }

        // Store session ID in user's session if authenticated
        if (auth()->check()) {
            Session::put('medical_chat_session', $sessionId);
        }

        return $sessionId;
    }

    /**
     * Save chat message to session
     */
    public function saveMessage(string $sessionId, array $message): void
    {
        $cacheKey = $this->sessionPrefix . $sessionId;
        $messages = Cache::get($cacheKey, []);

        // Limit messages to last 50 for performance
        $messages[] = array_merge($message, [
            'timestamp' => now()->toDateTimeString(),
            'id' => uniqid('msg_', true)
        ]);

        if (count($messages) > 50) {
            $messages = array_slice($messages, -50);
        }

        Cache::put($cacheKey, $messages, $this->cacheDuration);
    }

    /**
     * Get all messages from session
     */
    public function getMessages(string $sessionId): array
    {
        $cacheKey = $this->sessionPrefix . $sessionId;
        return Cache::get($cacheKey, []);
    }

    /**
     * Clear session messages
     */
    public function clearSession(string $sessionId): void
    {
        $cacheKey = $this->sessionPrefix . $sessionId;
        Cache::forget($cacheKey);
    }

    /**
     * Get session statistics
     */
    public function getSessionStats(string $sessionId): array
    {
        $messages = $this->getMessages($sessionId);

        return [
            'total_messages' => count($messages),
            'user_messages' => count(array_filter($messages, fn($msg) => ($msg['is_user'] ?? false))),
            'bot_messages' => count(array_filter($messages, fn($msg) => !($msg['is_user'] ?? false))),
            'session_created' => !empty($messages) ? $messages[0]['timestamp'] : null,
            'last_activity' => !empty($messages) ? end($messages)['timestamp'] : null
        ];
    }

    /**
     * Transfer anonymous session to user account
     */
    public function transferToUser(string $sessionId, int $userId): void
    {
        $messages = $this->getMessages($sessionId);

        if (!empty($messages)) {
            // Save to user's permanent chat history
            $userCacheKey = $this->sessionPrefix . 'user_' . $userId;
            $existingHistory = Cache::get($userCacheKey, []);

            $combinedHistory = array_merge($existingHistory, $messages);

            // Keep only last 100 messages for users
            if (count($combinedHistory) > 100) {
                $combinedHistory = array_slice($combinedHistory, -100);
            }

            Cache::put($userCacheKey, $combinedHistory, $this->cacheDuration * 7); // 7 days for users

            // Clear anonymous session
            $this->clearSession($sessionId);
        }
    }

    /**
     * Get user's chat history
     */
    public function getUserHistory(int $userId): array
    {
        $cacheKey = $this->sessionPrefix . 'user_' . $userId;
        return Cache::get($cacheKey, []);
    }

    /**
     * Check if question was already asked in session
     */
    public function findSimilarQuestionInSession(string $sessionId, string $question, float $threshold = 0.8): ?array
    {
        $messages = $this->getMessages($sessionId);
        $userMessages = array_filter($messages, fn($msg) => ($msg['is_user'] ?? false));

        foreach ($userMessages as $userMsg) {
            if (isset($userMsg['content'])) {
                $similarity = $this->calculateSimilarity($question, $userMsg['content']);
                if ($similarity >= $threshold) {
                    // Find corresponding bot response
                    $msgIndex = array_search($userMsg, $messages);
                    if ($msgIndex !== false && isset($messages[$msgIndex + 1])) {
                        $botResponse = $messages[$msgIndex + 1];
                        if (!($botResponse['is_user'] ?? false)) {
                            return [
                                'user_message' => $userMsg,
                                'bot_response' => $botResponse,
                                'similarity' => $similarity
                            ];
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Calculate text similarity
     */
    private function calculateSimilarity(string $text1, string $text2): float
    {
        $words1 = array_unique(str_word_count(strtolower($text1), 1));
        $words2 = array_unique(str_word_count(strtolower($text2), 1));

        $intersection = array_intersect($words1, $words2);
        $union = array_unique(array_merge($words1, $words2));

        return count($union) > 0 ? count($intersection) / count($union) : 0;
    }

    /**
     * Generate unique session ID
     */
    private function generateSessionId(): string
    {
        return 'chat_' . time() . '_' . bin2hex(random_bytes(8));
    }

    /**
     * Clean up old sessions (can be called by scheduled job)
     */
    public function cleanupOldSessions(): int
    {
        // This would be implemented to clean up old anonymous sessions
        // For now, just return 0
        return 0;
    }
}
