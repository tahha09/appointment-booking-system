import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { Notification } from '../../../core/services/notification';

interface MedicalImage {
  id: number;
  patient_id: number;
  title: string;
  description: string | null;
  image_type: string;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-medical-images',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-images.html',
  styleUrls: ['./medical-images.scss'],
})
export class MedicalImages implements OnInit {
  medicalImages: MedicalImage[] = [];
  loading = true;
  error = '';

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedImage: MedicalImage | null = null;

  // Form data
  formData: Partial<MedicalImage> = {
    title: '',
    description: '',
    image_type: 'x-ray',
  };
  customImageType = '';

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  imagesToRemove: string[] = [];

  submitting = false;
  imageIndexes: Record<number, number> = {};

  // Image types dropdown options
  imageTypes = [
    { value: 'x-ray', label: 'X-Ray' },
    { value: 'ct-scan', label: 'CT Scan' },
    { value: 'mri', label: 'MRI' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'lab-result', label: 'Lab Result' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'other', label: 'Other' },
  ];

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private notification: Notification
  ) { }

  ngOnInit(): void {
    this.fetchMedicalImages();
  }

  fetchMedicalImages(): void {
    this.loading = true;
    this.error = '';

    this.patientService.getMedicalImages().subscribe({
      next: (res: any) => {
        this.medicalImages = res.data || [];
        this.initializeImageIndexes();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load medical images.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openAddModal(): void {
    this.resetForm();
    this.showAddModal = true;
  }

  openEditModal(image: MedicalImage): void {
    this.selectedImage = image;
    this.formData = {
      title: image.title,
      description: image.description || '',
      image_type: image.image_type,
    };

    // Check if the image type is one of the predefined options
    const isPredefined = this.imageTypes.some(t => t.value === image.image_type);
    if (!isPredefined) {
      this.formData.image_type = 'other';
      this.customImageType = image.image_type;
    } else {
      this.customImageType = '';
    }

    this.existingImages = image.images || [];
    this.imagesToRemove = [];
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.showEditModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      image_type: 'x-ray',
    };
    this.customImageType = '';
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.existingImages = [];
    this.imagesToRemove = [];
    this.selectedImage = null;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.notification.error('Invalid file type', 'Please select only image files.');
          return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.notification.error('File too large', 'Image size should be less than 5MB.');
          return;
        }
        this.selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            this.imagePreviews.push(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeNewImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(imagePath: string): void {
    this.existingImages = this.existingImages.filter(img => img !== imagePath);
    this.imagesToRemove.push(imagePath);
  }

  getImageUrl(imagePath: string): string {
    return `http://localhost:8000/storage/${imagePath}`;
  }

  private initializeImageIndexes(): void {
    const indexes: Record<number, number> = {};
    this.medicalImages.forEach((image) => {
      const totalImages = image.images?.length ?? 0;
      if (totalImages > 0) {
        const previousIndex = this.imageIndexes[image.id] ?? 0;
        indexes[image.id] = previousIndex % totalImages;
      } else {
        indexes[image.id] = 0;
      }
    });
    this.imageIndexes = indexes;
  }

  getCurrentImagePath(image: MedicalImage): string | null {
    if (!image.images || image.images.length === 0) {
      return null;
    }
    const index = this.imageIndexes[image.id] ?? 0;
    const safeIndex = Math.min(Math.max(index, 0), image.images.length - 1);
    return image.images[safeIndex];
  }

  getImageIndex(image: MedicalImage): number {
    return this.imageIndexes[image.id] ?? 0;
  }

  changeSlide(image: MedicalImage, direction: number): void {
    if (!image.images || image.images.length === 0) {
      return;
    }
    const totalImages = image.images.length;
    const currentIndex = this.imageIndexes[image.id] ?? 0;
    const nextIndex = (currentIndex + direction + totalImages) % totalImages;
    this.imageIndexes[image.id] = nextIndex;
  }

  getImageTypeLabel(value: string): string {
    const type = this.imageTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  submitForm(): void {
    if (!this.formData.title?.trim()) {
      this.notification.error('Title is required.');
      return;
    }

    if (!this.formData.image_type) {
      this.notification.error('Image type is required.');
      return;
    }

    if (this.formData.image_type === 'other' && !this.customImageType.trim()) {
      this.notification.error('Please specify the image type.');
      return;
    }

    if (this.showEditModal && this.existingImages.length === 0 && this.selectedFiles.length === 0) {
      this.notification.error('Please add at least one image.');
      return;
    }

    if (!this.showEditModal && this.selectedFiles.length === 0) {
      this.notification.error('Please select at least one image to upload.');
      return;
    }

    this.submitting = true;
    this.error = '';

    const formData = new FormData();
    formData.append('title', this.formData.title || '');
    formData.append('title', this.formData.title || '');

    const finalImageType = this.formData.image_type === 'other' ? this.customImageType : this.formData.image_type;
    formData.append('image_type', finalImageType || 'x-ray');

    if (this.formData.description) formData.append('description', this.formData.description);

    this.selectedFiles.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });

    if (this.showEditModal && this.selectedImage) {
      // Update
      if (this.imagesToRemove.length > 0) {
        this.imagesToRemove.forEach((imagePath, index) => {
          formData.append(`remove_images[${index}]`, imagePath);
        });
      }

      this.patientService.updateMedicalImage(this.selectedImage.id, formData).subscribe({
        next: () => {
          this.notification.success('Medical image updated successfully.');
          this.fetchMedicalImages();
          this.closeModals();
          this.submitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update medical image.';
          this.notification.error('Update failed', this.error);
          this.submitting = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      // Create
      this.patientService.uploadMedicalImage(formData).subscribe({
        next: () => {
          this.notification.success('Medical images uploaded successfully.');
          this.fetchMedicalImages();
          this.closeModals();
          this.submitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to upload medical images.';
          this.notification.error('Upload failed', this.error);
          this.submitting = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  confirmDelete(image: MedicalImage): void {
    this.selectedImage = image;
    this.showDeleteConfirm = true;
  }

  deleteMedicalImage(): void {
    if (!this.selectedImage) return;

    this.patientService.deleteMedicalImage(this.selectedImage.id).subscribe({
      next: () => {
        this.notification.success('Medical image deleted successfully.');
        this.fetchMedicalImages();
        this.closeModals();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to delete medical image.';
        this.notification.error('Delete failed', this.error);
        this.cdr.detectChanges();
      },
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
