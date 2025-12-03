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
            $users = User::select('id', 'name', 'email', 'role', 'created_at', 'status', 'profile_image')
                        ->orderBy('created_at', 'desc')
                        ->simplePaginate($perPage);

            // Add profile_image_url to each user
            $users->getCollection()->transform(function ($user) {
                $user->profile_image_url = $user->profile_image
                    ? asset('storage/' . $user->profile_image)
                    : asset('storage/default-avatar.png');
                return $user;
            });

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

        // Only allow specific fields to be updated from the admin panel
        $data = $request->only(['name', 'email', 'role', 'status', 'profile_image']);

        // Normalize and validate status if present
        if ($request->has('status')) {
            $status = strtolower($request->input('status'));

            if (!in_array($status, ['active', 'inactive', 'suspended'])) {
                return response()->json([
                    'message' => 'Invalid status value.',
                ], 422);
            }

            $data['status'] = $status;
        }

        $user->fill($data);
        $user->save();

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
