<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ResetPasswordController extends Controller
{
    use ApiResponse;

    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required',
                'email' => 'required|email|exists:users,email',
                'password' => 'required|min:8|confirmed',
                'password_confirmation' => 'required'
            ], [
                'email.exists' => 'We cannot find a user with that email address.',
                'password.min' => 'Password must be at least 8 characters.',
                'password.confirmed' => 'Password confirmation does not match.'
            ]);

            if ($validator->fails()) {
                return $this->error($validator->errors()->first(), 422);
            }

            // Check token validity
            $tokenData = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$tokenData) {
                return $this->error('Invalid or expired reset token.', 400);
            }

            // Check if token is expired (60 minutes)
            $tokenCreatedAt = Carbon::parse($tokenData->created_at);
            if ($tokenCreatedAt->diffInMinutes(now()) > 60) {
                DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->delete();
                return $this->error('Reset token has expired. Please request a new one.', 400);
            }

            // Verify token
            $hashedToken = hash('sha256', $request->token);
            if (!hash_equals($tokenData->token, $hashedToken)) {
                return $this->error('Invalid reset token.', 400);
            }

            // Reset password
            $user = User::where('email', $request->email)->first();
            $user->password = Hash::make($request->password);
            $user->save();

            // Delete the used token
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            // Clear any existing tokens for auto-login
            $user->tokens()->delete();

            // Create new token for auto-login
            $authToken = $user->createToken('auth_token')->plainTextToken;

            Log::info('Password reset successful:', [
                'email' => $request->email,
                'user_id' => $user->id
            ]);

            return $this->success([
                'user' => $user->only(['id', 'name', 'email', 'role', 'status']),
                'token' => $authToken,
                'token_type' => 'Bearer'
            ], 'Password has been reset successfully!');

        } catch (\Exception $e) {
            Log::error('Reset password error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->error(
                'An error occurred while resetting your password. Please try again later.',
                500
            );
        }
    }
}
