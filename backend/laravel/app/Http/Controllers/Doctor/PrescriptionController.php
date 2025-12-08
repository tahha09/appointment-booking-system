<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\MedicalHistory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Notifications\PatientPrescriptionNotification;
use App\Models\User;
use App\Models\Patient;

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

            // Create medical history record for the completed appointment
            $medicalNote = $appointment->medicalNote;
            $condition = $medicalNote ? $medicalNote->diagnosis : 'Appointment completed with prescription';
            $diagnosis = $medicalNote ? $medicalNote->diagnosis : 'Consultation and prescription provided';
            $treatment = $medicalNote ? $medicalNote->treatment : 'Prescribed: ' . $validated['medication_name'];
            $notes = 'Prescription: ' . $validated['medication_name'] . ' (' . $validated['dosage'] . ')';
            if ($validated['notes']) {
                $notes .= ' - ' . $validated['notes'];
            }
            if ($medicalNote && $medicalNote->notes) {
                $notes .= ' - ' . $medicalNote->notes;
            }

            MedicalHistory::create([
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $doctor->id,
                'condition' => $condition,
                'diagnosis' => $diagnosis,
                'treatment' => $treatment,
                'notes' => $notes,
                'visit_date' => $appointment->appointment_date,
            ]);

            if ($appointment->patient) {
                $patientUser = User::find($appointment->patient->user_id);
                
                if ($patientUser) {
                    $doctor->load(['user', 'specialization']);
                    $doctorName = $doctor->user->name ?? 'Dr. ' . ($doctor->full_name ?? 'Unknown');
                    $specializationName = $doctor->specialization->name ?? 'General Medicine';
                    
                    $patientUser->notify(new PatientPrescriptionNotification('prescription_created', [
                        'title' => 'New Medical Prescription',
                        'message' => "Dr. {$doctorName} ({$specializationName}) has prescribed you: {$validated['medication_name']}",
                        'type' => 'info',
                        'prescription_id' => $prescription->id,
                        'doctor_name' => $doctorName,
                        'specialization' => $specializationName,
                        'medication_name' => $validated['medication_name'],
                        'dosage' => $validated['dosage'],
                        'frequency' => $validated['frequency'],
                        'duration' => $validated['duration'],
                        'subject' => 'New Medical Prescription',
                    ]));
                }
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
