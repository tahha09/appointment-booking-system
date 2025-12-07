<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleAuthController;

Route::get('/', function () {
    return view('welcome');
});

// Google OAuth Routes
Route::get('/auth/google', [GoogleAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);

// Debug route for Google OAuth configuration
Route::get('/test-google-config', function () {
    return response()->json([
        'APP_URL' => env('APP_URL'),
        'FRONTEND_URL' => env('FRONTEND_URL'),
        'GOOGLE_CLIENT_ID' => env('GOOGLE_CLIENT_ID') ? 'SET' : 'NOT SET',
        'GOOGLE_CLIENT_SECRET' => env('GOOGLE_CLIENT_SECRET') ? 'SET' : 'NOT SET',
        'redirect_uri' => env('APP_URL', 'http://localhost:8000') . '/auth/google/callback',
        'current_time' => now(),
        'environment' => app()->environment(),
    ]);
});

// Test OAuth callback URL construction
Route::get('/test-oauth-callback', function () {
    $user = [
        'id' => 1,
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'doctor',
        'profile_image' => null,
    ];

    $token = 'test_token_123';
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
    $redirectUrl = $frontendUrl . '/auth/callback?token=' . $token . '&user=' . urlencode(json_encode($user));

    return response()->json([
        'frontend_url' => $frontendUrl,
        'redirect_url' => $redirectUrl,
        'user_data' => $user,
        'token' => $token,
    ]);
});

// Test specializations endpoint
Route::get('/test-specializations', function () {
    $specializations = \App\Models\Specialization::select('id', 'name', 'description')->get();

    return response()->json([
        'success' => true,
        'message' => 'Specializations test',
        'data' => $specializations,
        'count' => $specializations->count(),
    ]);
});
