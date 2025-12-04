<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $patient = $request->user()->patient;

            if (!$patient) {
                return $this->notFound('Patient profile not found');
            }

            $query = $patient->prescriptions()
                ->with(['doctor.user', 'doctor.specialization'])
                ->orderBy('prescribed_date', 'desc');

            // Filter by date range
            if ($request->has('date_from')) {
                $query->where('prescribed_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('prescribed_date', '<=', $request->date_to);
            }

            // Search by medication name, dosage, frequency, or instructions
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('medication_name', 'like', "%{$search}%")
                        ->orWhere('dosage', 'like', "%{$search}%")
                        ->orWhere('frequency', 'like', "%{$search}%")
                        ->orWhere('instructions', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            }

            // Filter by doctor
            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $prescriptions = $query->get();

            return $this->success($prescriptions, 'Prescriptions retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve prescriptions: ' . $e->getMessage(), 500);
        }
    }
}

