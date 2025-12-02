<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\UpdateProfileRequest;
use App\Http\Requests\Patient\DeleteAccountRequest;
use App\Models\Patient;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/patient/profile
     * Get the authenticated patient's profile
     */
    public function show(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorized('User not authenticated');
            }

            // Get or create patient record
            $patient = $user->patient;
            
            if (!$patient) {
                $patient = Patient::create([
                    'user_id' => $user->id,
                ]);
            }

            return $this->success([
                'fullName' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'dateOfBirth' => $user->date_of_birth
                    ? $user->date_of_birth->format('Y-m-d')
                    : null,
                'address' => $user->address,
                'bloodType' => $patient->blood_type,
                'profileImage' => $user->profile_image_url,
            ], 'Profile retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error fetching patient profile: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to retrieve profile: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/patient/profile
     * Update the authenticated patient's profile
     */
    public function update(UpdateProfileRequest $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorized('User not authenticated');
            }

            // Get or create patient record
            $patient = $user->patient;

            if (!$patient) {
                $patient = Patient::create([
                    'user_id' => $user->id,
                ]);
            }

            $data = $request->validated();

            $user->name = $data['fullName'];
            $user->phone = $data['phone'] ?? null;
            $user->date_of_birth = $data['dateOfBirth'] ?? null;
            $user->address = $data['address'] ?? null;
            
            // Update patient blood type
            if (isset($data['bloodType'])) {
                $patient->blood_type = $data['bloodType'];
                $patient->save();
            }

            // Handle password change if requested
            if (!empty($data['newPassword'])) {
                if (empty($data['currentPassword']) || !Hash::check($data['currentPassword'], $user->password)) {
                    return $this->validationError([
                        'currentPassword' => ['Current password is incorrect.'],
                    ]);
                }

                $user->password = $data['newPassword'];
            }

            // Handle profile image update (expects base64 data URL string)
            if (!empty($data['profileImage']) && is_string($data['profileImage'])) {
                $imageDataUrl = $data['profileImage'];

                if (str_starts_with($imageDataUrl, 'data:image')) {
                    [$meta, $content] = explode(',', $imageDataUrl, 2);

                    $extension = 'png';
                    if (preg_match('/^data:image\/(\w+);base64/', $meta, $matches)) {
                        $extension = strtolower($matches[1]);
                    }

                    $binary = base64_decode($content, true);
                    if ($binary !== false) {
                        $path = 'profiles/' . $user->id . '_' . time() . '.' . $extension;
                        Storage::disk('public')->put($path, $binary);
                        $user->profile_image = $path;
                    }
                }
            }

            $user->save();

            // Refresh patient relationship
            $patient->refresh();

            return $this->success([
                'fullName' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'dateOfBirth' => $user->date_of_birth
                    ? $user->date_of_birth->format('Y-m-d')
                    : null,
                'address' => $user->address,
                'bloodType' => $patient->blood_type,
                'profileImage' => $user->profile_image_url,
            ], 'Profile updated successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors(), 'Validation failed');
        } catch (\Exception $e) {
            Log::error('Error updating patient profile: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to update profile: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/patient/account
     * Delete the authenticated patient's account
     */
    public function destroy(DeleteAccountRequest $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorized('User not authenticated');
            }

            if (!Hash::check($request->validated()['password'], $user->password)) {
                return $this->validationError([
                    'password' => ['Password is incorrect.'],
                ]);
            }

            // Revoke all tokens for this user
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }

            $user->delete();

            return $this->success(null, 'Account deleted successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors(), 'Validation failed');
        } catch (\Exception $e) {
            Log::error('Error deleting patient account: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->error('Failed to delete account: ' . $e->getMessage(), 500);
        }
    }
}
