<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use GuzzleHttp\Client;

class GoogleAuthController extends Controller
{
    use ApiResponse;

    /**
     * Create a Guzzle client with SSL verification disabled for development
     */
    private function createHttpClient()
    {
        return new Client([
            'verify' => env('APP_ENV') === 'production', // Enable SSL in production, disable in development
        ]);
    }

    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->setHttpClient($this->createHttpClient())
            ->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->setHttpClient($this->createHttpClient())
                ->user();

            // Check if user exists by email
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // User exists, log them in
                return $this->loginExistingUser($user, $googleUser);
            } else {
                // New user, create account
                return $this->createNewUser($googleUser);
            }
        } catch (\Exception $e) {
            // For API callback, return JSON error
            return response()->json([
                'success' => false,
                'error' => 'Google authentication failed',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Login existing user
     */
    private function loginExistingUser($user, $googleUser)
    {
        // Update profile image if not set
        if (!$user->profile_image && $googleUser->getAvatar()) {
            $user->profile_image = $googleUser->getAvatar();
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Redirect to frontend with token
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profile_image' => $user->profile_image,
        ];

        $redirectUrl = $frontendUrl . '/auth/callback?token=' . $token . '&user=' . urlencode(json_encode($userData));

        return redirect($redirectUrl);
    }

    /**
     * Create new user from Google data
     */
    private function createNewUser($googleUser)
    {
        try {
            $user = DB::transaction(function () use ($googleUser) {
                // Create user with Google data
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => bcrypt("password"), // Random password for Google users
                    'role' => 'patient', // Default role, can be changed later
                    'status' => 'active',
                    'profile_image' => $googleUser->getAvatar(),
                ]);

                // Create patient record by default
                Patient::create([
                    'user_id' => $user->id,
                ]);

                return $user;
            });

            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect to frontend with token and flag for role selection
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
            $redirectUrl = $frontendUrl . '/auth/callback?token=' . $token . '&new_user=true&user=' . urlencode(json_encode([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_image' => $user->profile_image,
            ]));

            return redirect($redirectUrl);
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '/register?error=google_registration_failed');
        }
    }

    /**
     * Update user role after Google registration
     */
    public function updateRoleAfterGoogleAuth()
    {
        try {
            $data = request()->validate([
                'role' => 'required|in:patient,doctor',
                'specializationId' => 'required_if:role,doctor|exists:specializations,id',
            ]);

            $user = auth()->user();

            DB::transaction(function () use ($user, $data) {
                // Update user role
                $user->role = $data['role'];
                $user->save();

                // Remove existing role-specific record
                Patient::where('user_id', $user->id)->delete();
                Doctor::where('user_id', $user->id)->delete();

                // Create new role-specific record
                if ($data['role'] === 'patient') {
                    Patient::create([
                        'user_id' => $user->id,
                    ]);
                } elseif ($data['role'] === 'doctor') {
                    Doctor::create([
                        'user_id' => $user->id,
                        'specialization_id' => $data['specializationId'],
                        'license_number' => 'GOOGLE-' . $user->id . '-' . time(),
                        'experience_years' => 0,
                        'consultation_fee' => 50.00,
                        'biography' => 'Doctor registered via Google',
                        'rating' => 0,
                        'is_approved' => false,
                    ]);
                }
            });

            return $this->success([
                'user' => $user->fresh(),
            ], 'Role updated successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
