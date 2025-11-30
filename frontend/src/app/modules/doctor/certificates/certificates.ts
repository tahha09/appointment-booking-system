import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Certificate {
  id: number;
  doctor_id: number;
  title: string;
  description: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificates.html',
  styleUrls: ['./certificates.scss'],
})
export class Certificates implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api';
  certificates: Certificate[] = [];
  loading = true;
  error = '';
  
  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedCertificate: Certificate | null = null;
  
  // Form data
  formData: Partial<Certificate> = {
    title: '',
    description: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
  };
  
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  imagesToRemove: string[] = [];
  
  submitting = false;
  imageIndexes: Record<number, number> = {};

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchCertificates();
  }

  fetchCertificates(): void {
    this.loading = true;
    this.error = '';

    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: Certificate[]; message: string }>(
        `${this.apiBase}/doctor/certificates`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.certificates = res.data || [];
          this.initializeImageIndexes();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Unable to load certificates.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openAddModal(): void {
    this.resetForm();
    this.showAddModal = true;
  }

  openEditModal(certificate: Certificate): void {
    this.selectedCertificate = certificate;
    this.formData = {
      title: certificate.title,
      description: certificate.description || '',
      issuing_organization: certificate.issuing_organization || '',
      issue_date: certificate.issue_date ? certificate.issue_date.split('T')[0] : '',
      expiry_date: certificate.expiry_date ? certificate.expiry_date.split('T')[0] : '',
    };
    this.existingImages = certificate.images || [];
    this.imagesToRemove = [];
    this.selectedImages = [];
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
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
    };
    this.selectedImages = [];
    this.imagePreviews = [];
    this.existingImages = [];
    this.imagesToRemove = [];
    this.selectedCertificate = null;
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        this.selectedImages.push(file);
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
    this.selectedImages.splice(index, 1);
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
    this.certificates.forEach((certificate) => {
      const totalImages = certificate.images?.length ?? 0;
      if (totalImages > 0) {
        const previousIndex = this.imageIndexes[certificate.id] ?? 0;
        indexes[certificate.id] = previousIndex % totalImages;
      } else {
        indexes[certificate.id] = 0;
      }
    });
    this.imageIndexes = indexes;
  }

  getCurrentImagePath(certificate: Certificate): string | null {
    if (!certificate.images || certificate.images.length === 0) {
      return null;
    }
    const index = this.imageIndexes[certificate.id] ?? 0;
    const safeIndex = Math.min(Math.max(index, 0), certificate.images.length - 1);
    return certificate.images[safeIndex];
  }

  getImageIndex(certificate: Certificate): number {
    return this.imageIndexes[certificate.id] ?? 0;
  }

  changeSlide(certificate: Certificate, direction: number): void {
    if (!certificate.images || certificate.images.length === 0) {
      return;
    }
    const totalImages = certificate.images.length;
    const currentIndex = this.imageIndexes[certificate.id] ?? 0;
    const nextIndex = (currentIndex + direction + totalImages) % totalImages;
    this.imageIndexes[certificate.id] = nextIndex;
  }

  submitForm(): void {
    if (!this.formData.title) {
      this.error = 'Title is required.';
      return;
    }

    this.submitting = true;
    this.error = '';

    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    const formData = new FormData();
    formData.append('title', this.formData.title || '');
    if (this.formData.description) formData.append('description', this.formData.description);
    if (this.formData.issuing_organization) formData.append('issuing_organization', this.formData.issuing_organization);
    if (this.formData.issue_date) formData.append('issue_date', this.formData.issue_date);
    if (this.formData.expiry_date) formData.append('expiry_date', this.formData.expiry_date);
    
    this.selectedImages.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });

    if (this.showEditModal && this.selectedCertificate) {
      // Update
      if (this.imagesToRemove.length > 0) {
        this.imagesToRemove.forEach((imagePath, index) => {
          formData.append(`remove_images[${index}]`, imagePath);
        });
      }
      
      formData.append('_method', 'PUT');

      this.http
        .post<{ success: boolean; data: Certificate; message: string }>(
          `${this.apiBase}/doctor/certificates/${this.selectedCertificate.id}`,
          formData,
          { headers }
        )
        .subscribe({
          next: () => {
            this.fetchCertificates();
            this.closeModals();
            this.submitting = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = err?.error?.message || 'Failed to update certificate.';
            this.submitting = false;
            this.cdr.detectChanges();
          },
        });
    } else {
      // Create
      this.http
        .post<{ success: boolean; data: Certificate; message: string }>(
          `${this.apiBase}/doctor/certificates`,
          formData,
          { headers }
        )
        .subscribe({
          next: () => {
            this.fetchCertificates();
            this.closeModals();
            this.submitting = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = err?.error?.message || 'Failed to create certificate.';
            this.submitting = false;
            this.cdr.detectChanges();
          },
        });
    }
  }

  confirmDelete(certificate: Certificate): void {
    this.selectedCertificate = certificate;
    this.showDeleteConfirm = true;
  }

  deleteCertificate(): void {
    if (!this.selectedCertificate) return;

    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .delete<{ success: boolean; message: string }>(
        `${this.apiBase}/doctor/certificates/${this.selectedCertificate.id}`,
        { headers }
      )
      .subscribe({
        next: () => {
          this.fetchCertificates();
          this.closeModals();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to delete certificate.';
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
