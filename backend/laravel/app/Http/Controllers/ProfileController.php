<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\DeleteAccountRequest;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Admin;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request)
    {
        $user = $request->user();
        $responseData = $this->getBaseProfileData($user);

        // Add role-specific data
        $this->addRoleSpecificData($user, $responseData);

        return $this->success($responseData, 'Profile retrieved successfully');
    }

    private function getBaseProfileData(User $user): array
    {
        return [
            'fullName' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'dateOfBirth' => $user->date_of_birth
                ? (is_string($user->date_of_birth) ? $user->date_of_birth : $user->date_of_birth->format('Y-m-d'))
                : null,
            'address' => $user->address,
            'profileImage' => $user->profile_image_url ?? ($user->profile_image ? Storage::url($user->profile_image) : null),
            'role' => $user->role,
        ];
    }

    private function addRoleSpecificData(User $user, array &$responseData): void
    {
        switch ($user->role) {
            case 'patient':
                $this->addPatientData($user, $responseData);
                break;
            case 'doctor':
                $this->addDoctorData($user, $responseData);
                break;
            case 'admin':
                $this->addAdminData($user, $responseData);
                break;
            // Add other roles as needed
        }
    }

    private function addPatientData(User $user, array &$responseData): void
    {
        $patient = $user->patient;
        if (!$patient) {
            $patient = Patient::create([
                'user_id' => $user->id,
                // Add any default patient fields here
            ]);
        }

        // Add patient-specific fields
        $responseData['medicalHistory'] = $patient->medical_history ?? null;
        $responseData['allergies'] = $patient->allergies ?? null;
        $responseData['emergencyContact'] = $patient->emergency_contact ?? null;
        $responseData['insuranceProvider'] = $patient->insurance_provider ?? null;
        $responseData['insurancePolicyNumber'] = $patient->insurance_policy_number ?? null;
        $responseData['bloodType'] = $patient->blood_type ?? null;
    }

    private function addDoctorData(User $user, array &$responseData): void
    {
        $doctor = $user->doctor;
        if (!$doctor) {
            $doctor = Doctor::create([
                'user_id' => $user->id,
                // Add any default doctor fields here
            ]);
        }

        // Load specialization relationship to get the name
        $doctor->load('specialization');
        $responseData['specialty'] = $doctor->specialization->name ?? null;
        $responseData['licenseNumber'] = $doctor->license_number ?? null;
        $responseData['qualifications'] = $doctor->qualifications ?? null;
        $responseData['experienceYears'] = $doctor->experience_years ?? null;
        $responseData['bio'] = $doctor->bio ?? null;
        $responseData['consultationFee'] = $doctor->consultation_fee ?? null;
        $responseData['availability'] = $doctor->availability ?? null;
        $responseData['department'] = $doctor->department ?? null;
    }

    private function addAdminData(User $user, array &$responseData): void
    {
        $admin = $user->admin;
        if (!$admin) {
            $admin = Admin::create([
                'user_id' => $user->id,
                // Add any default admin fields here
            ]);
        }

        $responseData['department'] = $admin->department ?? null;
        $responseData['permissions'] = $admin->permissions ?? null;
        $responseData['adminLevel'] = $admin->admin_level ?? null;
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Update common user fields
        $user->name = $data['fullName'] ?? $user->name;
        $user->phone = $data['phone'] ?? $user->phone;
        $user->date_of_birth = $data['dateOfBirth'] ?? $user->date_of_birth;
        $user->address = $data['address'] ?? $user->address;

        // Handle profile image update
        if (!empty($data['profileImage']) && is_string($data['profileImage'])) {
            $this->updateProfileImage($user, $data['profileImage']);
        }

        // Handle password change if requested
        if (!empty($data['newPassword'])) {
            if (empty($data['currentPassword']) || !Hash::check($data['currentPassword'], $user->password)) {
                return $this->validationError([
                    'currentPassword' => ['Current password is incorrect.'],
                ]);
            }

            if ($data['newPassword'] !== ($data['confirmNewPassword'] ?? null)) {
                return $this->validationError([
                    'confirmNewPassword' => ['New password confirmation does not match.'],
                ]);
            }

            $user->password = $data['newPassword'];
        }

        $user->save();

        // Update role-specific data
        $this->updateRoleSpecificData($user, $data);

        // Return updated profile data
        $responseData = $this->getBaseProfileData($user);
        $this->addRoleSpecificData($user, $responseData);

        return $this->success($responseData, 'Profile updated successfully');
    }

    private function updateProfileImage(User $user, string $imageDataUrl): void
    {
        if (!str_starts_with($imageDataUrl, 'data:image')) {
            return;
        }

        [$meta, $content] = explode(',', $imageDataUrl, 2);

        $extension = 'png';
        if (preg_match('/^data:image\/(\w+);base64/', $meta, $matches)) {
            $extension = strtolower($matches[1]);
        }

        $binary = base64_decode($content, true);
        if ($binary === false) {
            return;
        }

        // Delete old profile image if exists
        if ($user->profile_image && Storage::disk('public')->exists($user->profile_image)) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $path = 'profiles/' . $user->id . '_' . time() . '.' . $extension;
        Storage::disk('public')->put($path, $binary);
        $user->profile_image = $path;
    }

    private function updateRoleSpecificData(User $user, array $data): void
    {
        switch ($user->role) {
            case 'patient':
                $this->updatePatientData($user, $data);
                break;
            case 'doctor':
                $this->updateDoctorData($user, $data);
                break;
            case 'admin':
                $this->updateAdminData($user, $data);
                break;
            // Add other roles as needed
        }
    }

    private function updatePatientData(User $user, array $data): void
    {
        $patient = $user->patient ?? Patient::create(['user_id' => $user->id]);

        // Update patient-specific fields
        $patient->medical_history = $data['medicalHistory'] ?? $patient->medical_history;
        $patient->allergies = $data['allergies'] ?? $patient->allergies;
        $patient->emergency_contact = $data['emergencyContact'] ?? $patient->emergency_contact;
        $patient->insurance_provider = $data['insuranceProvider'] ?? $patient->insurance_provider;
        $patient->insurance_policy_number = $data['insurancePolicyNumber'] ?? $patient->insurance_policy_number;
        $patient->blood_type = $data['bloodType'] ?? $patient->blood_type;

        $patient->save();
    }

    private function updateDoctorData(User $user, array $data): void
    {
        $doctor = $user->doctor ?? Doctor::create([
            'user_id' => $user->id,
            'is_approved' => false, // New doctors start as unapproved
        ]);

        // Update doctor-specific fields
        $doctor->specialty = $data['specialty'] ?? $doctor->specialty;
        $doctor->license_number = $data['licenseNumber'] ?? $doctor->license_number;
        $doctor->qualifications = $data['qualifications'] ?? $doctor->qualifications;
        $doctor->experience_years = $data['experienceYears'] ?? $doctor->experience_years;
        $doctor->bio = $data['bio'] ?? $doctor->bio;
        $doctor->consultation_fee = $data['consultationFee'] ?? $doctor->consultation_fee;
        $doctor->availability = $data['availability'] ?? $doctor->availability;
        $doctor->department = $data['department'] ?? $doctor->department;

        $doctor->save();
    }

    private function updateAdminData(User $user, array $data): void
    {
        $admin = $user->admin ?? Admin::create(['user_id' => $user->id]);

        // Update admin-specific fields
        $admin->department = $data['department'] ?? $admin->department;
        $admin->permissions = $data['permissions'] ?? $admin->permissions;
        $admin->admin_level = $data['adminLevel'] ?? $admin->admin_level;

        $admin->save();
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        if (!Hash::check($data['currentPassword'], $user->password)) {
            return $this->validationError([
                'currentPassword' => ['Current password is incorrect.'],
            ]);
        }

        $user->password = $data['newPassword'];
        $user->save();

        return $this->success(null, 'Password updated successfully');
    }

    public function destroy(DeleteAccountRequest $request)
    {
        $user = $request->user();

        if (!Hash::check($request->validated()['password'], $user->password)) {
            return $this->validationError([
                'password' => ['Password is incorrect.'],
            ]);
        }

        // Delete role-specific data first
        $this->deleteRoleSpecificData($user);

        // Revoke all tokens for this user
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        $user->delete();

        return $this->success(null, 'Account deleted successfully');
    }

    private function deleteRoleSpecificData(User $user): void
    {
        switch ($user->role) {
            case 'patient':
                $user->patient?->delete();
                break;
            case 'doctor':
                $user->doctor?->delete();
                break;
            case 'admin':
                $user->admin?->delete();
                break;
            // Add other roles as needed
        }
    }

    // Optional: Get minimal profile info for dropdowns, etc.
    public function getBasicInfo(Request $request)
    {
        $user = $request->user();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profileImage' => $user->profile_image_url ?? ($user->profile_image ? Storage::url($user->profile_image) : null),
        ], 'Basic profile info retrieved');
    }
}
