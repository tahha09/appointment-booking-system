<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\MedicalHistory;
use App\Models\Patient;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MedicalHistoryController extends Controller
{
    use ApiResponse;

    /**
     * Get the patient record for the authenticated user
     */
    private function getPatient()
    {
        $user = Auth::user();
        
        if (!$user) {
            return null;
        }

        // Get or create patient record
        $patient = $user->patient;
        
        if (!$patient) {
            // Create patient record if it doesn't exist
            $patient = Patient::create([
                'user_id' => $user->id,
            ]);
        }

        return $patient;
    }

    /**
     * GET /api/patient/medical-history
     * Get all medical history records for the authenticated patient
     */
    public function index()
    {
        try {
            $patient = $this->getPatient();

            if (!$patient) {
                return $this->unauthorized('User not found or not authenticated');
            }

            $history = MedicalHistory::where('patient_id', $patient->id)
                ->orderByDesc('created_at')
                ->get();

            return $this->success($history, 'Medical history retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error fetching medical history: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to retrieve medical history: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/patient/medical-history
     * Create a new medical history record
     */
    public function store(Request $request)
    {
        try {
            $patient = $this->getPatient();

            if (!$patient) {
                return $this->unauthorized('User not found or not authenticated');
            }

            $data = $request->validate([
                'chronic_diseases' => 'nullable|string|max:1000',
                'allergies'        => 'nullable|string|max:1000',
                'surgeries'        => 'nullable|string|max:1000',
                'medications'      => 'nullable|string|max:1000',
                'family_history'   => 'nullable|string|max:1000',
                'social_history'   => 'nullable|string|max:1000',
                'notes'            => 'nullable|string|max:2000',
            ]);

            $data['patient_id'] = $patient->id;

            $history = MedicalHistory::create($data);

            return $this->success($history, 'Medical history record created successfully', 201);
        } catch (ValidationException $e) {
            return $this->validationError($e->errors(), 'Validation failed');
        } catch (\Exception $e) {
            Log::error('Error creating medical history: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to create medical history record: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/patient/medical-history/{id}
     * Update an existing medical history record
     */
    public function update(Request $request, $id)
    {
        try {
            $patient = $this->getPatient();

            if (!$patient) {
                return $this->unauthorized('User not found or not authenticated');
            }

            $history = MedicalHistory::where('patient_id', $patient->id)
                ->where('id', $id)
                ->first();

            if (!$history) {
                return $this->notFound('Medical history record not found');
            }

            $data = $request->validate([
                'chronic_diseases' => 'nullable|string|max:1000',
                'allergies'        => 'nullable|string|max:1000',
                'surgeries'        => 'nullable|string|max:1000',
                'medications'      => 'nullable|string|max:1000',
                'family_history'   => 'nullable|string|max:1000',
                'social_history'   => 'nullable|string|max:1000',
                'notes'            => 'nullable|string|max:2000',
            ]);

            $history->update($data);

            return $this->success($history, 'Medical history record updated successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors(), 'Validation failed');
        } catch (\Exception $e) {
            Log::error('Error updating medical history: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'history_id' => $id,
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to update medical history record: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/patient/medical-history/{id}
     * Delete a medical history record
     */
    public function destroy($id)
    {
        try {
            $patient = $this->getPatient();

            if (!$patient) {
                return $this->unauthorized('User not found or not authenticated');
            }

            $history = MedicalHistory::where('patient_id', $patient->id)
                ->where('id', $id)
                ->first();

            if (!$history) {
                return $this->notFound('Medical history record not found');
            }

            $history->delete();

            return $this->success(null, 'Medical history record deleted successfully');
        } catch (\Exception $e) {
            Log::error('Error deleting medical history: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'history_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to delete medical history record: ' . $e->getMessage(), 500);
        }
    }
}
