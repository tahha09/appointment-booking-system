<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fullName' => 'required|string|min:3|max:255',
            'phone' => 'nullable|string|max:255',
            'dateOfBirth' => 'nullable|date',
            'address' => 'nullable|string',
            'currentPassword' => 'nullable|string',
            'newPassword' => 'nullable|string|min:6',
            'confirmNewPassword' => 'nullable|string|same:newPassword',
            'profileImage' => 'nullable|string',
            'bloodType' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ];
    }
}
