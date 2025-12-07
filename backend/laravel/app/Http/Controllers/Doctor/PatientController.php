<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Patient;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use App\Notifications\PatientBlockNotifications;
use Illuminate\Support\Facades\Storage;

class PatientController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;

            $query = Patient::with(['user'])
                ->whereHas('appointments', function ($query) use ($doctorId) {
                    $query->where('doctor_id', $doctorId);
                });

            // Filter by blocked status
            if ($request->has('blocked') && $request->blocked === 'true') {
                $blockedPatientIds = DB::table('blocked_patients')
                    ->where('doctor_id', $doctorId)
                    ->pluck('patient_id');
                $query->whereIn('id', $blockedPatientIds);
            } elseif ($request->has('blocked') && $request->blocked === 'false') {
                $blockedPatientIds = DB::table('blocked_patients')
                    ->where('doctor_id', $doctorId)
                    ->pluck('patient_id');
                $query->whereNotIn('id', $blockedPatientIds);
            }

            // Search by name
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            $query->orderByDesc('id');

            // Pagination
            $perPage = $request->get('per_page', 5);
            $patients = $query->paginate($perPage);

            // Get blocked status for each patient
            $blockedPatientIds = DB::table('blocked_patients')
                ->where('doctor_id', $doctorId)
                ->pluck('patient_id')
                ->toArray();

            $patientsData = $patients->map(function ($patient) use ($blockedPatientIds) {
                $patientArray = $patient->toArray();
                $patientArray['is_blocked'] = in_array($patient->id, $blockedPatientIds);
                return $patientArray;
            });

            return $this->success([
                'patients' => $patientsData,
                'pagination' => [
                    'current_page' => $patients->currentPage(),
                    'last_page' => $patients->lastPage(),
                    'per_page' => $patients->perPage(),
                    'total' => $patients->total(),
                ]
            ], 'Patients retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;

            $patient = Patient::with([
                    'user',
                    'appointments.medicalNote',
                    'medicalImages' => function ($query) {
                        $query->orderBy('created_at', 'desc');
                    }
                ])
                ->whereHas('appointments', function ($query) use ($doctorId) {
                    $query->where('doctor_id', $doctorId);
                })
                ->find($id);

            if (!$patient) {
                return $this->error('Patient not found.', 404);
            }

            // Check if blocked
            $isBlocked = DB::table('blocked_patients')
                ->where('doctor_id', $doctorId)
                ->where('patient_id', $id)
                ->exists();

            $patientData = $patient->toArray();
            $patientData['is_blocked'] = $isBlocked;
            $patientData['medical_images'] = $patient->medicalImages->map(function ($image) {
                return [
                    'id' => $image->id,
                    'title' => $image->title,
                    'description' => $image->description,
                    'image_type' => $image->image_type,
                    'images' => collect($image->images ?? [])->map(function ($path) {
                        return Storage::url($path);
                    })->toArray(),
                    'created_at' => $image->created_at,
                    'updated_at' => $image->updated_at,
                ];
            })->toArray();

            return $this->success($patientData, 'Patient retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function block(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $validated = $request->validate([
                'reason' => 'nullable|string|max:500',
            ]);

            $doctorId = $user->doctor->id;

            // Check if patient has appointments with this doctor
            $hasAppointments = DB::table('appointments')
                ->where('doctor_id', $doctorId)
                ->where('patient_id', $id)
                ->exists();

            if (!$hasAppointments) {
                return $this->error('Patient not found in your appointments.', 404);
            }

            // Block patient
            DB::table('blocked_patients')->updateOrInsert(
                [
                    'doctor_id' => $doctorId,
                    'patient_id' => $id,
                ],
                [
                    'reason' => $validated['reason'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Send notification to patient
           $patient = Patient::find($id);
           if ($patient && $patient->user) {
              $patient->user->notify(new PatientBlockNotifications('warning', [
                'title' => 'You have been blocked',
                'message' => 'The doctor has blocked your profile. You may not be able to book new appointments.',
              ]));
           }

            return $this->success(null, 'Patient blocked successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function unblock(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;

            $deleted = DB::table('blocked_patients')
                ->where('doctor_id', $doctorId)
                ->where('patient_id', $id)
                ->delete();

            if ($deleted) {
                // Send notification to patient
               $patient = Patient::find($id);
               if ($patient && $patient->user) {
                  $patient->user->notify(new PatientBlockNotifications('success', [
                    'title' => 'You have been unblocked',
                    'message' => 'The doctor has unblocked your profile. You can now book appointments again.',
                 ]));
               }
                return $this->success(null, 'Patient unblocked successfully');
            }

            return $this->error('Patient is not blocked.', 404);

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function patientAppointments(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;

            $appointments = DB::table('appointments')
                ->where('doctor_id', $doctorId)
                ->where('patient_id', $id)
                ->orderBy('appointment_date', 'desc')
                ->orderBy('start_time', 'desc')
                ->get();

            // Get medical notes for each appointment
            $appointmentIds = $appointments->pluck('id');
            $medicalNotes = DB::table('medical_notes')
                ->whereIn('appointment_id', $appointmentIds)
                ->get()
                ->keyBy('appointment_id');

            $appointmentsData = $appointments->map(function ($appointment) use ($medicalNotes) {
                $appointmentArray = (array) $appointment;
                $appointmentArray['medical_note'] = $medicalNotes->get($appointment->id);
                return $appointmentArray;
            });

            return $this->success($appointmentsData, 'Patient appointments retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
