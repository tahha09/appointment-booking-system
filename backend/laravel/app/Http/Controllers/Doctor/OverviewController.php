<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class OverviewController extends Controller
{
    /**
     * Return patient counts for the authenticated doctor over the last 6 months.
     */
    public function patientCounts(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->doctor) {
            return response()->json(['error' => 'Authenticated doctor not found.'], 404);
        }

        $doctorId = $user->doctor->id;
        $sixMonthsAgo = Carbon::now()->subMonths(6);

        $patientCounts = Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', '>=', $sixMonthsAgo)
            ->selectRaw('DATE_FORMAT(appointment_date, "%Y-%m") as month, COUNT(DISTINCT patient_id) as patient_count')
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json([
            'data' => $patientCounts,
            'message' => 'Patient counts retrieved successfully',
        ]);

    }
}
