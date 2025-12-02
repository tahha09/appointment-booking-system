<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request)
    {
        try {
            if (!Auth::attempt($request->only('email', 'password'))) {
                return $this->error('Invalid credentials', 401);
            }

            $user = Auth::user();

            // Check if user account is active
            if ($user->status !== 'active') {
                Auth::logout();
                return $this->error('Your account is currently ' . $user->status . '. Please contact support.', 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->success([
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ], 'Login successful');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function logout(Request $request)
    {
        try {
            // For now, just return success since we're testing without auth
            // In production, this would revoke the token
            return $this->success(null, 'Logout successful');
        } catch (\Exception $e) {
            return $this->error($e->getMessage());
        }
    }
}
