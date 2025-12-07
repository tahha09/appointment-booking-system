<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'fullName' => 'required|string|min:3|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:patient,doctor',
            'profileImage' => 'nullable|string',
        ];

        // Add specialization validation for doctors
        if ($this->input('role') === 'doctor') {
            $rules['specializationId'] = 'required|exists:specializations,id';
        }

        return $rules;
    }
}
