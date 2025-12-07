<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RegisterController extends Controller
{
    use ApiResponse;

    public function register(RegisterRequest $request)
    {
        try {
            $data = $request->validated();

            $user = DB::transaction(function () use ($data) {
                $user = User::create([
                    'name' => $data['fullName'],
                    'email' => $data['email'],
                    'password' => $data['password'],
                    'role' => $data['role'],
                    'status' => 'active', // Set default status to active
                ]);

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
                            $user->save();
                        }
                    }
                }

                if ($user->role === 'patient') {
                    Patient::create([
                        'user_id' => $user->id,
                    ]);
                } elseif ($user->role === 'doctor') {
                    Doctor::create([
                        'user_id' => $user->id,
                        'specialization_id' => $data['specializationId'],
                        'license_number' => 'TEMP-' . $user->id . '-' . time(), // Temporary license number
                        'experience_years' => 0,
                        'consultation_fee' => 50.00, // Default fee
                        'biography' => 'New doctor profile',
                        'rating' => 0,
                        'is_approved' => false, // Doctors need admin approval
                    ]);
                }

                return $user;
            });

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->success([
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ], 'Registration successful', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
