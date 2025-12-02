<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class OverviewController extends Controller
{
    /**
     * Return patient counts for the authenticated doctor over the last 6 months.
     */
    public function patientCounts(Request $request)
    {
        // Commented out logging to prevent potential serialization loops
        // Log::info('OverviewController@patientCounts called');
        // Log::info('Request URL: ' . $request->fullUrl());
        // Log::info('User: ' . ($request->user() ? $request->user()->id : 'No user'));

        $user = $request->user();

        if (!$user) {
            // Log::warning('No authenticated user');
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        // Query doctor directly by user_id to avoid relationship loading
        $doctor = \App\Models\Doctor::where('user_id', $user->id)->first();
        if (!$doctor) {
            // Log::warning('User is not a doctor', ['user_id' => $user->id]);
            return response()->json(['error' => 'Authenticated doctor not found.'], 404);
        }

        $doctorId = $doctor->id;
        // Log::info('Doctor ID: ' . $doctorId);

        $sixMonthsAgo = Carbon::now()->subMonths(6);

        // Use raw query to avoid potential serialization issues
        $patientCounts = DB::select("
            SELECT DATE_FORMAT(appointment_date, '%Y-%m') as month, COUNT(DISTINCT patient_id) as patient_count
            FROM appointments
            WHERE doctor_id = ? AND appointment_date >= ?
            GROUP BY DATE_FORMAT(appointment_date, '%Y-%m')
            ORDER BY month ASC
        ", [$doctorId, $sixMonthsAgo->toDateString()]);

        // Log::info('Patient counts retrieved: ' . count($patientCounts) . ' records');

        return response()->json([
            'data' => $patientCounts,
            'message' => 'Patient counts retrieved successfully',
        ]);
    }
}
