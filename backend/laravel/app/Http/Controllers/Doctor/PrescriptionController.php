<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PrescriptionController extends Controller
{
    use ApiResponse;

    /**
     * Store a newly created prescription for an appointment.
     */
    public function store(Request $request, int $appointmentId)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctor = $user->doctor;

            $appointment = Appointment::with('patient')
                ->forDoctor($doctor->id)
                ->find($appointmentId);

            if (!$appointment) {
                return $this->error('Appointment not found.', 404);
            }

            if (!$appointment->patient) {
                return $this->error('Patient information not available for this appointment.', 404);
            }

            $validated = $request->validate([
                'medication_name' => 'required|string|max:255',
                'dosage' => 'required|string|max:255',
                'frequency' => 'required|string|max:255',
                'duration' => 'required|string|max:255',
                'instructions' => 'nullable|string',
                'notes' => 'nullable|string',
                'prescribed_date' => 'nullable|date',
                'status' => 'nullable|in:active,completed,cancelled',
            ]);

            $prescription = Prescription::create([
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $doctor->id,
                'appointment_id' => $appointment->id,
                'medication_name' => $validated['medication_name'],
                'dosage' => $validated['dosage'],
                'frequency' => $validated['frequency'],
                'duration' => $validated['duration'],
                'instructions' => $validated['instructions'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'prescribed_date' => $validated['prescribed_date'] ?? now()->toDateString(),
                'status' => $validated['status'] ?? 'active',
            ]);

            if ($appointment->status !== 'completed') {
                $appointment->update(['status' => 'completed']);
            }

            $prescription->load(['patient.user', 'doctor.user', 'doctor.specialization', 'appointment']);

            return $this->success($prescription, 'Prescription saved and appointment marked as completed.');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->error('Failed to save prescription: ' . $e->getMessage(), 500);
        }
    }
}
