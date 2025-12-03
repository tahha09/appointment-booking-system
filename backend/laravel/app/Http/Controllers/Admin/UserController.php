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
            $perPage = $request->get('per_page', 6); // Default 6 users per page as requested
            $page = $request->get('page', 1);
            
            // Get filter parameters
            $excludeUserId = $request->get('exclude_user_id', null);
            $role = $request->get('role', null);
            $status = $request->get('status', null);
            $search = $request->get('search', null);

            // Build query with doctor relationship for status checking
            $query = User::with('doctor')
                        ->select('id', 'name', 'email', 'role', 'created_at', 'status', 'profile_image')
                        ->orderBy('created_at', 'desc');

            // Exclude the currently logged-in user (always exclude if authenticated)
            if ($request->user()) {
                $query->where('id', '!=', $request->user()->id);
            } elseif ($excludeUserId) {
                // Fallback: exclude by provided user ID
                $query->where('id', '!=', $excludeUserId);
            }

            // Filter by role if provided (and not 'ALL')
            if ($role && strtoupper($role) !== 'ALL') {
                $query->where('role', strtolower($role));
            }

            // Filter by status if provided (and not 'ALL')
            if ($status && strtoupper($status) !== 'ALL') {
                $statusLower = strtolower($status);
                // Handle 'PENDING' status for doctors (unapproved doctors)
                if ($statusLower === 'pending') {
                    // PENDING status means doctors with is_approved = false
                    // Only apply if role filter is not set or is set to 'doctor'
                    if (!$role || strtolower($role) === 'doctor' || strtoupper($role) === 'DOCTOR') {
                        $query->where('role', 'doctor')
                              ->whereHas('doctor', function($q) {
                                  $q->where('is_approved', false);
                              });
                    } else {
                        // If role filter is set to something other than doctor, return empty
                        $query->whereRaw('1 = 0'); // Force empty result
                    }
                } else {
                    // For other statuses (active, inactive, suspended), filter by user status
                    $query->where('status', $statusLower);
                }
            }

            // Search by name or email
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                });
            }

            // Use paginate instead of simplePaginate to get total count
            $users = $query->paginate($perPage, ['*'], 'page', $page);

            // Add profile_image_url and normalize status for each user
            $users->getCollection()->transform(function ($user) {
                $user->profile_image_url = $user->profile_image
                    ? asset('storage/' . $user->profile_image)
                    : asset('storage/default-avatar.png');
                
                // For doctors, check if they are approved to determine status
                if ($user->role === 'doctor' && $user->doctor) {
                    if (!$user->doctor->is_approved) {
                        $user->status = 'pending';
                    }
                }
                
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

    public function stats()
    {
        try {
            $today = now()->format('Y-m-d');

            // Get total counts by role
            $totalUsers = User::count();
            $totalAdmins = User::where('role', 'admin')->count();
            $totalDoctors = User::where('role', 'doctor')->count();
            $totalPatients = User::where('role', 'patient')->count();

            // Get approved doctors count
            $approvedDoctors = User::where('role', 'doctor')
                ->whereHas('doctor', function($query) {
                    $query->where('is_approved', true);
                })
                ->count();

            // Get pending doctors count
            $pendingDoctors = User::where('role', 'doctor')
                ->whereHas('doctor', function($query) {
                    $query->where('is_approved', false);
                })
                ->count();

            // Get appointments counts
            $totalAppointments = \App\Models\Appointment::count();
            $todaysAppointments = \App\Models\Appointment::whereDate('appointment_date', $today)->count();

            // Get new users today
            $newUsersToday = User::whereDate('created_at', $today)->count();

            return response()->json([
                'totalUsers' => $totalUsers,
                'totalAdmins' => $totalAdmins,
                'totalDoctors' => $totalDoctors,
                'totalPatients' => $totalPatients,
                'approvedDoctors' => $approvedDoctors,
                'pendingApprovals' => $pendingDoctors,
                'totalAppointments' => $totalAppointments,
                'todaysAppointments' => $todaysAppointments,
                'newUsersToday' => $newUsersToday,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading stats: ' . $e->getMessage());
            return response()->json([
                'error' => 'Unable to load statistics',
                'message' => 'An error occurred while fetching statistics.'
            ], 500);
        }
    }
}
