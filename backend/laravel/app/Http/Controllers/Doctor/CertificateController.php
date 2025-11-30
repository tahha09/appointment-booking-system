<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Certificate;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
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
            $certificates = Certificate::where('doctor_id', $doctorId)
                ->orderBy('issue_date', 'desc')
                ->get();

            return $this->success($certificates, 'Certificates retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'issuing_organization' => 'nullable|string|max:255',
                'issue_date' => 'nullable|date',
                'expiry_date' => 'nullable|date|after_or_equal:issue_date',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $doctorId = $user->doctor->id;

            // Handle image uploads
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('certificates', 'public');
                    $imagePaths[] = $path;
                }
            }

            $certificate = Certificate::create([
                'doctor_id' => $doctorId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'issuing_organization' => $validated['issuing_organization'] ?? null,
                'issue_date' => $validated['issue_date'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'images' => !empty($imagePaths) ? $imagePaths : null,
            ]);

            return $this->success($certificate, 'Certificate created successfully', 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
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
            $certificate = Certificate::where('doctor_id', $doctorId)->find($id);

            if (!$certificate) {
                return $this->error('Certificate not found.', 404);
            }

            return $this->success($certificate, 'Certificate retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $certificate = Certificate::where('doctor_id', $doctorId)->find($id);

            if (!$certificate) {
                return $this->error('Certificate not found.', 404);
            }

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'issuing_organization' => 'nullable|string|max:255',
                'issue_date' => 'nullable|date',
                'expiry_date' => 'nullable|date|after_or_equal:issue_date',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
                'remove_images' => 'nullable|array', // Array of image paths to remove
            ]);

            // Handle image removal
            if (isset($validated['remove_images']) && is_array($validated['remove_images'])) {
                $currentImages = $certificate->images ?? [];
                foreach ($validated['remove_images'] as $imageToRemove) {
                    if (Storage::disk('public')->exists($imageToRemove)) {
                        Storage::disk('public')->delete($imageToRemove);
                    }
                    $currentImages = array_values(array_filter($currentImages, function($img) use ($imageToRemove) {
                        return $img !== $imageToRemove;
                    }));
                }
                $validated['images'] = $currentImages;
            }

            // Handle new image uploads
            if ($request->hasFile('images')) {
                $imagePaths = $certificate->images ?? [];
                foreach ($request->file('images') as $image) {
                    $path = $image->store('certificates', 'public');
                    $imagePaths[] = $path;
                }
                $validated['images'] = $imagePaths;
            }

            // Remove 'remove_images' from validated data before update
            unset($validated['remove_images']);

            $certificate->update($validated);

            return $this->success($certificate, 'Certificate updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed: ' . json_encode($e->errors()), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->doctor) {
                return $this->error('Authenticated doctor not found.', 404);
            }

            $doctorId = $user->doctor->id;
            $certificate = Certificate::where('doctor_id', $doctorId)->find($id);

            if (!$certificate) {
                return $this->error('Certificate not found.', 404);
            }

            // Delete associated images
            if ($certificate->images) {
                foreach ($certificate->images as $imagePath) {
                    if (Storage::disk('public')->exists($imagePath)) {
                        Storage::disk('public')->delete($imagePath);
                    }
                }
            }

            $certificate->delete();

            return $this->success(null, 'Certificate deleted successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}

