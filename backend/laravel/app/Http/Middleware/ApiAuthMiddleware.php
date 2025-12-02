<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ApiAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token not provided'
            ], 401);
        }

        // Find token in database
        $tokenRecord = DB::table('personal_access_tokens')
            ->where('token', hash('sha256', $token))
            ->whereNull('expires_at')
            ->orWhere('expires_at', '>', now())
            ->first();

        if (!$tokenRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token'
            ], 401);
        }

        // Get the user
        $user = \App\Models\User::find($tokenRecord->tokenable_id);
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is ' . $user->status
            ], 401);
        }

        // Set the authenticated user
        Auth::setUser($user);

        return $next($request);
    }
}
