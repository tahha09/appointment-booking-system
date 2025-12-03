<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();

        $rules = [
            'fullName' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'dateOfBirth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'profileImage' => ['nullable', 'string'],
            'currentPassword' => ['nullable', 'string', 'min:6'],
            'newPassword' => ['nullable', 'string', 'min:6'],
            'confirmNewPassword' => ['nullable', 'string', 'min:6', 'same:newPassword'],
        ];

        // Add role-specific validation rules
        switch ($user->role) {
            case 'patient':
                $rules = array_merge($rules, [
                    'medicalHistory' => ['nullable', 'string'],
                    'allergies' => ['nullable', 'string'],
                    'emergencyContact' => ['nullable', 'string', 'max:20'],
                    'insuranceProvider' => ['nullable', 'string', 'max:100'],
                    'insurancePolicyNumber' => ['nullable', 'string', 'max:50'],
                ]);
                break;

            case 'doctor':
                $rules = array_merge($rules, [
                    'specialty' => ['nullable', 'string', 'max:100'],
                    'licenseNumber' => ['nullable', 'string', 'max:50'],
                    'qualifications' => ['nullable', 'string'],
                    'experienceYears' => ['nullable', 'integer', 'min:0'],
                    'bio' => ['nullable', 'string'],
                    'consultationFee' => ['nullable', 'numeric', 'min:0'],
                    'availability' => ['nullable', 'string'],
                    'department' => ['nullable', 'string', 'max:100'],
                ]);
                break;

            case 'admin':
                $rules = array_merge($rules, [
                    'department' => ['nullable', 'string', 'max:100'],
                    'permissions' => ['nullable', 'array'],
                    'adminLevel' => ['nullable', 'string', 'in:super_admin,admin,moderator'],
                ]);
                break;
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'fullName.required' => 'Full name is required.',
            'newPassword.min' => 'New password must be at least 6 characters.',
            'confirmNewPassword.same' => 'Password confirmation does not match.',
        ];
    }
}
