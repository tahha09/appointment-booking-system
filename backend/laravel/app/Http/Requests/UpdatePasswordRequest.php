<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:6', 'different:currentPassword'],
            'confirmNewPassword' => ['required', 'string', 'min:6', 'same:newPassword'],
        ];
    }

    public function messages(): array
    {
        return [
            'currentPassword.required' => 'Current password is required.',
            'newPassword.required' => 'New password is required.',
            'newPassword.min' => 'New password must be at least 6 characters.',
            'newPassword.different' => 'New password must be different from current password.',
            'confirmNewPassword.same' => 'Password confirmation does not match.',
        ];
    }
}
