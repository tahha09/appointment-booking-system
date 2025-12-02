<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\DeleteAccountRequest;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request)
    {
        $user = $request->user();

        return $this->success([
            'fullName' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'dateOfBirth' => $user->date_of_birth ?: null,
            'address' => $user->address,
            'profileImage' => $user->profile_image ?: null,
        ], 'Profile retrieved successfully');
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $user->name = $data['fullName'];
        $user->phone = $data['phone'] ?? null;
        $user->date_of_birth = $data['dateOfBirth'] ?? null;
        $user->address = $data['address'] ?? null;

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

        return $this->success([
            'fullName' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'dateOfBirth' => $user->date_of_birth
                ? $user->date_of_birth->format('Y-m-d')
                : null,
            'address' => $user->address,
            'profileImage' => $user->profile_image ?: null,
        ], 'Profile updated successfully');
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

        // Revoke all tokens for this user
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        $user->delete();

        return $this->success(null, 'Account deleted successfully');
    }
}
