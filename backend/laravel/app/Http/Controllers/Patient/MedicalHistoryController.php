<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class MedicalHistoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
        $patient = $request->user()->patient;

        if (!$patient) {
                return $this->notFound('Patient profile not found');
        }

            $query = $patient->medicalHistory()
                ->with(['doctor.user', 'doctor.specialization'])
                ->orderBy('visit_date', 'desc');

            // Filter by date range
            if ($request->has('date_from')) {
                $query->where('visit_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('visit_date', '<=', $request->date_to);
            }

            // Search by condition, diagnosis, or treatment
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('condition', 'like', "%{$search}%")
                        ->orWhere('diagnosis', 'like', "%{$search}%")
                        ->orWhere('treatment', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            }

            // Filter by doctor
            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            $perPage = $request->input('per_page', 8);
            $history = $query->paginate($perPage);

            return $this->success($history, 'Medical history retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve medical history: ' . $e->getMessage(), 500);
        }
    }
}
