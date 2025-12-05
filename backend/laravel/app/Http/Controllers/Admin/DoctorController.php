<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use Illuminate\Http\Request;
use App\Notifications\DoctorNotifications;


class DoctorController extends Controller
{
    public function pendingDoctors(Request $request)
    {
        // Get pending doctors with pagination to prevent memory exhaustion
        // A doctor is pending if is_approved = 0 (unapproved)
        $perPage = $request->get('per_page', 15); // Default 15 doctors per page
        $doctors = User::where('users.role', 'doctor')
            ->join('doctors', 'doctors.user_id', '=', 'users.id')
            ->where('doctors.is_approved', 0) // Unapproved doctors
            ->leftJoin('specializations', 'specializations.id', '=', 'doctors.specialization_id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'specializations.name as specialty',
                'doctors.license_number',
                'doctors.experience_years',
                'doctors.consultation_fee',
                'doctors.biography',
                'doctors.rating',
                'doctors.is_approved',
                'users.status as user_status',
                'users.created_at'
            )
            ->orderBy('users.created_at', 'desc')
            ->paginate($perPage);

        return response()->json($doctors);
    }

    public function approveDoctor($id)
    {
        $doctor = User::findOrFail($id);
        $doctor->status = 'active'; // Valid enum value for users.status
        $doctor->save();

        // Also update doctors.is_approved
        $doctorDetails = Doctor::where('user_id', $id)->first();
        if ($doctorDetails) {
            $doctorDetails->is_approved = 1;
            $doctorDetails->save();
        }

         // Send notification (database + email)
        $doctor->notify(new DoctorNotifications('success',
    [
        'title' => 'Your account has been approved',
        'message' => 'Your doctor account has been successfully approved.',
        'type' => 'success'
    ]));


        return response()->json([
            'success' => true,
            'message' => 'Doctor approved successfully',
            'doctor' => $doctor
        ]);
    }

    public function rejectDoctor($id)
    {
        $doctor = User::findOrFail($id);
        $doctor->status = 'inactive'; // Valid enum value for users.status
        $doctor->save();

        // Also update doctors.is_approved
        $doctorDetails = Doctor::where('user_id', $id)->first();
        if ($doctorDetails) {
            $doctorDetails->is_approved = 0;
            $doctorDetails->save();
        }

        // Send notification (database + email)
        $doctor->notify(new DoctorNotifications('error',
    [
        'title' => 'Your account has been rejected',
        'message' => 'Sorry, your doctor account has been rejected.',
        'type' => 'error'
    ]));


        return response()->json([
            'success' => true,
            'message' => 'Doctor rejected',
            'doctor' => $doctor
        ]);
    }

    public function doctorReport(Request $request)
    {
        // Simple doctor report with pagination to prevent memory exhaustion
        $perPage = $request->get('per_page', 15); // Default 15 doctors per page
        $doctors = User::where('role', 'doctor')
            ->where('status', 'active') // Changed from 'approved' to 'active'
            ->select('id', 'name')
            ->withCount(['appointments as total_appointments'])
            ->withCount([
                'appointments as completed_appointments' => function ($query) {
                    $query->where('status', 'completed');
                }
            ])
            ->paginate($perPage)
            ->through(function ($doctor) {
                return [
                    'name' => $doctor->name,
                    'total_appointments' => $doctor->total_appointments,
                    'completed_appointments' => $doctor->completed_appointments,
                    'rating' => rand(40, 50) / 10 // Random rating for demo
                ];
            });

        return response()->json($doctors);
    }
}
