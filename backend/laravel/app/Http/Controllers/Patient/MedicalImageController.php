<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MedicalImage;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Storage;

class MedicalImageController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;
            $medicalImages = MedicalImage::where('patient_id', $patientId)
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->success($medicalImages, 'Medical images retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image_type' => 'required|string|in:x-ray,ct-scan,mri,ultrasound,lab-result,prescription,other',
                'images' => 'required|array|min:1',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            $patientId = $user->patient->id;

            // Handle image uploads
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('medical-images', 'public');
                    $imagePaths[] = $path;
                }
            }

            $medicalImage = MedicalImage::create([
                'patient_id' => $patientId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'image_type' => $validated['image_type'],
                'images' => $imagePaths,
            ]);

            return $this->success($medicalImage, 'Medical images uploaded successfully', 201);

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

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;
            $medicalImage = MedicalImage::where('patient_id', $patientId)->find($id);

            if (!$medicalImage) {
                return $this->error('Medical image not found.', 404);
            }

            return $this->success($medicalImage, 'Medical image retrieved successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;
            $medicalImage = MedicalImage::where('patient_id', $patientId)->find($id);

            if (!$medicalImage) {
                return $this->error('Medical image not found.', 404);
            }

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'image_type' => 'sometimes|required|string|in:x-ray,ct-scan,mri,ultrasound,lab-result,prescription,other',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
                'remove_images' => 'nullable|array', // Array of image paths to remove
            ]);

            // Handle image removal
            if (isset($validated['remove_images']) && is_array($validated['remove_images'])) {
                $currentImages = $medicalImage->images ?? [];
                foreach ($validated['remove_images'] as $imageToRemove) {
                    if (Storage::disk('public')->exists($imageToRemove)) {
                        Storage::disk('public')->delete($imageToRemove);
                    }
                    $currentImages = array_values(array_filter($currentImages, function ($img) use ($imageToRemove) {
                        return $img !== $imageToRemove;
                    }));
                }
                $validated['images'] = $currentImages;
            }

            // Handle new image uploads
            if ($request->hasFile('images')) {
                $imagePaths = $medicalImage->images ?? [];
                foreach ($request->file('images') as $image) {
                    $path = $image->store('medical-images', 'public');
                    $imagePaths[] = $path;
                }
                $validated['images'] = $imagePaths;
            }

            // Ensure at least one image exists
            $finalImages = $validated['images'] ?? $medicalImage->images ?? [];
            if (empty($finalImages)) {
                return $this->error('At least one image is required.', 422);
            }

            // Remove 'remove_images' from validated data before update
            unset($validated['remove_images']);

            $medicalImage->update($validated);

            return $this->success($medicalImage, 'Medical image updated successfully');

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

            if (!$user || !$user->patient) {
                return $this->error('Authenticated patient not found.', 404);
            }

            $patientId = $user->patient->id;
            $medicalImage = MedicalImage::where('patient_id', $patientId)->find($id);

            if (!$medicalImage) {
                return $this->error('Medical image not found.', 404);
            }

            // Delete associated images
            if ($medicalImage->images) {
                foreach ($medicalImage->images as $imagePath) {
                    if (Storage::disk('public')->exists($imagePath)) {
                        Storage::disk('public')->delete($imagePath);
                    }
                }
            }

            $medicalImage->delete();

            return $this->success(null, 'Medical image deleted successfully');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
