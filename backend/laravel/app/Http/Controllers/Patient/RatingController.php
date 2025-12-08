<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Rating;
use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    use ApiResponse;

    /**
     * Submit a rating for a completed appointment
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $validated = $request->validate([
                'appointment_id' => 'required|exists:appointments,id',
                'rating' => 'required|numeric|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $appointment = Appointment::with(['doctor'])->find($validated['appointment_id']);

            if (!$appointment) {
                return $this->error('Appointment not found.', 404);
            }

            // Verify appointment belongs to patient
            if ($appointment->patient_id !== $user->patient->id) {
                return $this->error('Unauthorized access to appointment.', 403);
            }

            // Verify appointment is completed
            if ($appointment->status !== 'completed') {
                return $this->error('You can only rate completed appointments.', 400);
            }

            // Check if rating already exists
            $existingRating = Rating::where('appointment_id', $validated['appointment_id'])->first();
            if ($existingRating) {
                return $this->error('You have already rated this appointment.', 400);
            }

            // Create rating
            $rating = Rating::create([
                'appointment_id' => $validated['appointment_id'],
                'patient_id' => $user->patient->id,
                'doctor_id' => $appointment->doctor_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            // Update doctor's average rating
            $this->updateDoctorRating($appointment->doctor_id);

            return $this->success($rating, 'Rating submitted successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Update an existing rating
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $validated = $request->validate([
                'rating' => 'required|numeric|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $rating = Rating::where('patient_id', $user->patient->id)->find($id);

            if (!$rating) {
                return $this->error('Rating not found.', 404);
            }

            $rating->update([
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            // Update doctor's average rating
            $this->updateDoctorRating($rating->doctor_id);

            return $this->success($rating, 'Rating updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get rating for an appointment
     */
    public function show(Request $request, $appointmentId)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $rating = Rating::where('appointment_id', $appointmentId)
                ->where('patient_id', $user->patient->id)
                ->first();

            if (!$rating) {
                return $this->success(null, 'No rating found for this appointment');
            }

            return $this->success($rating, 'Rating retrieved successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Update doctor's average rating
     */
    private function updateDoctorRating($doctorId)
    {
        $averageRating = Rating::where('doctor_id', $doctorId)
            ->avg('rating');

        Doctor::where('id', $doctorId)->update([
            'rating' => round($averageRating, 2),
        ]);
    }
}

