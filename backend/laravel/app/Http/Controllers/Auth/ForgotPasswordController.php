<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ForgotPasswordController extends Controller
{
    use ApiResponse;

    // public function sendResetLink(Request $request)
    // {
    //     try {
    //         Log::info('Forgot password request received:', $request->all());

    //         $validator = Validator::make($request->all(), [
    //             'email' => 'required|email',
    //         ]);

    //         if ($validator->fails()) {
    //             Log::warning('Validation failed:', $validator->errors()->toArray());
    //             return $this->error($validator->errors()->first(), 422);
    //         }

    //         // Check if user exists first
    //         $user = User::where('email', $request->email)->first();
    //         if (!$user) {
    //             Log::warning('User not found for email:', ['email' => $request->email]);
    //             return $this->success(
    //                 null,
    //                 'If your email exists in our system, you will receive a password reset link shortly.'
    //             );
    //         }

    //         // Generate token
    //         $token = Str::random(60);
    //         $hashedToken = hash('sha256', $token);

    //         // Delete any existing tokens for this user
    //         DB::table('password_reset_tokens')
    //             ->where('email', $request->email)
    //             ->delete();

    //         // Insert new token
    //         DB::table('password_reset_tokens')->insert([
    //             'email' => $request->email,
    //             'token' => $hashedToken,
    //             'created_at' => now()
    //         ]);

    //         Log::info('Password reset token generated:', [
    //             'email' => $request->email,
    //             'token' => $token,
    //             'hashed_token' => $hashedToken
    //         ]);

    //         // TODO: In production, send email with reset link
    //         // Example: $user->notify(new ResetPasswordNotification($token));

    //         // For testing, return success with token
    //         return $this->success(
    //             [
    //                 'message' => 'Reset link generated successfully.',
    //                 'test_token' => $token, // Remove this line in production
    //                 'test_email' => $request->email // Remove this line in production
    //             ],
    //             'If your email exists in our system, you will receive a password reset link shortly.'
    //         );

    //     } catch (\Exception $e) {
    //         Log::error('Forgot password error:', [
    //             'message' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //             'request' => $request->all()
    //         ]);

    //         return $this->error(
    //             'An error occurred while processing your request. Please try again later.',
    //             500
    //         );
    //     }
    // }


    public function sendResetLink(Request $request)
    {
        try {
            Log::info('Forgot password request received:', $request->all());

            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed:', $validator->errors()->toArray());
                return $this->error($validator->errors()->first(), 422);
            }

            // Check if user exists first
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                Log::warning('User not found for email:', ['email' => $request->email]);
                return $this->success(
                    null,
                    'If your email exists in our system, you will receive a password reset link shortly.'
                );
            }

            // Generate token
            $token = Str::random(60);
            $hashedToken = hash('sha256', $token);

            // Delete any existing tokens for this user
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            // Insert new token
            DB::table('password_reset_tokens')->insert([
                'email' => $request->email,
                'token' => $hashedToken,
                'created_at' => now()
            ]);

            // Send email with reset link
            $user->notify(new \App\Notifications\CustomResetPassword($token));

            Log::info('Password reset email sent:', [
                'email' => $request->email,
                'token' => $token
            ]);

            return $this->success(
                null,
                'If your email exists in our system, you will receive a password reset link shortly.'
            );

        } catch (\Exception $e) {
            Log::error('Forgot password error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return $this->error(
                'An error occurred while processing your request. Please try again later.',
                500
            );
        }
    }

}
