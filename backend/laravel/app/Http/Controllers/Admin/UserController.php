<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Set memory limit for this operation
            ini_set('memory_limit', '256M');

            // Get users with pagination and chunking to prevent memory exhaustion
            $perPage = $request->get('per_page', 10); // Default 10 users per page for safety
            $page = $request->get('page', 1);

            // Use chunking for better memory management
            $users = User::select('id', 'name', 'email', 'role', 'created_at', 'status')
                        ->orderBy('created_at', 'desc')
                        ->simplePaginate($perPage);

            // Convert to array to avoid potential serialization issues
            $userData = $users->toArray();

            return response()->json($userData);

        } catch (\Exception $e) {
            // Log the error and return a safe response
            \Log::error('Error loading users: ' . $e->getMessage());

            return response()->json([
                'error' => 'Unable to load users',
                'message' => 'An error occurred while fetching users. Please try again later.'
            ], 500);
        }
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update($request->all());
        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
