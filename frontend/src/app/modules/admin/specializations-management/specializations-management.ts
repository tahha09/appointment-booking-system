import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService, Specialization } from '../../../core/services/admin';
import Swal from 'sweetalert2';

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  experience_years: number;
  consultation_fee: number;
  is_approved: boolean;
  rating?: number;
  total_reviews?: number;
  specialization_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-specializations-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './specializations-management.html',
  styleUrl: './specializations-management.scss',
})
export class SpecializationsManagement implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  specializations: Specialization[] = [];
  pagination: Pagination = {
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
    from: 0,
    to: 0
  };

  isLoading = false;
  hasError = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirmModal = false;
  showDeleteResultModal = false;
  showDoctorsModal = false; // Add this
  showCreateSuccessModal = false;

  // Form data
  newSpecialization: Partial<Specialization> = { name: '', description: '' };
  editSpecialization: Specialization | null = null;
  specializationToDelete: Specialization | null = null;

  // Doctors data
  currentSpecialization: Specialization | null = null;
  doctors: Doctor[] = [];
  isLoadingDoctors = false;
  hasErrorDoctors = false;

  // Result messages
  deleteResultSuccess: boolean | null = null;
  deleteResultMessage = '';

  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadSpecializations();

    // Setup search with debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadSpecializations();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  loadSpecializations() {
    this.isLoading = true;
    this.hasError = false;

    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.adminService.getSpecializations(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: Specialization[], meta: any }) => {
          this.specializations = response.data;
          this.pagination = response.meta;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading specializations:', error);
          this.hasError = true;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadSpecializations();
    }
  }

  goToPreviousPage() {
    if (this.hasPreviousPage()) {
      this.pagination.current_page--;
      this.loadSpecializations();
    }
  }

  goToNextPage() {
    if (this.hasNextPage()) {
      this.pagination.current_page++;
      this.loadSpecializations();
    }
  }

  hasPreviousPage(): boolean {
    return this.pagination.current_page > 1;
  }

  hasNextPage(): boolean {
    return this.pagination.current_page < this.pagination.last_page;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.pagination.current_page;
    const last = this.pagination.last_page;

    if (last <= 7) {
      for (let i = 1; i <= last; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(last);
      } else if (current >= last - 3) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = last - 4; i <= last; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(last);
      }
    }

    return pages;
  }

  // Modal methods
  openCreateModal() {
    this.newSpecialization = { name: '', description: '' };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newSpecialization = { name: '', description: '' };
    this.cdr.detectChanges();
  }

  openEditModal(specialization: Specialization) {
    this.editSpecialization = { ...specialization };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editSpecialization = null;
    this.cdr.detectChanges();
  }

  openDeleteConfirm(specialization: Specialization) {
    this.specializationToDelete = specialization;
    this.showDeleteConfirmModal = true;
    this.cdr.detectChanges();
  }

  cancelDelete() {
    this.showDeleteConfirmModal = false;
    this.specializationToDelete = null;
    this.cdr.detectChanges();
  }

  closeDeleteResultModal() {
    this.showDeleteResultModal = false;
    this.deleteResultSuccess = null;
    this.deleteResultMessage = '';
    this.cdr.detectChanges();
  }

  // NEW: Doctors Modal Methods
  openDoctorsModal(specialization: Specialization) {
    this.currentSpecialization = specialization;
    this.showDoctorsModal = true;
    this.loadDoctors(specialization.id);
    this.cdr.detectChanges();
  }

  closeDoctorsModal() {
    this.showDoctorsModal = false;
    this.currentSpecialization = null;
    this.doctors = [];
    this.isLoadingDoctors = false;
    this.hasErrorDoctors = false;
    this.cdr.detectChanges();
  }

  loadDoctors(specializationId: number) {
    this.isLoadingDoctors = true;
    this.hasErrorDoctors = false;

    this.adminService.getDoctorsBySpecialization(specializationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.doctors = response.data || response;
          this.isLoadingDoctors = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading doctors:', error);
          this.hasErrorDoctors = true;
          this.isLoadingDoctors = false;
          this.cdr.detectChanges();
        }
      });
  }

  // CRUD operations
  createSpecialization() {
    if (!this.newSpecialization.name?.trim()) {
      return;
    }

    this.adminService.createSpecialization({
      name: this.newSpecialization.name,
      description: this.newSpecialization.description
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (specialization: Specialization) => {
          this.closeCreateModal();
          this.loadSpecializations();
          // Show SweetAlert success modal for 2 seconds
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Specialization created successfully',
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true,
            customClass: {
              popup: 'swal2-popup-custom'
            }
          });
        },
        error: (error: any) => {
          console.error('Error creating specialization:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to create specialization. Please try again.',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  updateSpecialization() {
    if (!this.editSpecialization || !this.editSpecialization.name?.trim()) {
      return;
    }

    this.adminService.updateSpecialization(this.editSpecialization.id, {
      name: this.editSpecialization.name,
      description: this.editSpecialization.description
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (specialization: Specialization) => {
          this.closeEditModal();
          this.loadSpecializations();
        },
        error: (error: any) => {
          console.error('Error updating specialization:', error);
        }
      });
  }

  confirmDelete() {
    if (!this.specializationToDelete) {
      return;
    }

    this.adminService.deleteSpecialization(this.specializationToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleteResultSuccess = true;
          this.deleteResultMessage = 'Specialization deleted successfully';
          this.showDeleteConfirmModal = false;
          this.showDeleteResultModal = true;
          this.specializationToDelete = null;
          this.loadSpecializations();
        },
        error: (error: any) => {
          console.error('Error deleting specialization:', error);
          this.deleteResultSuccess = false;
          this.deleteResultMessage = error.error?.message || 'Failed to delete specialization';
          this.showDeleteConfirmModal = false;
          this.showDeleteResultModal = true;
          this.specializationToDelete = null;
        }
      });
  }

  // Helper method to format currency
  formatCurrency(amount: any): string {
    if (amount == null) {
      return '$0.00';
    }

    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return '$0.00';
    }

    return '$' + numAmount.toFixed(2);
  }

  // Helper method to get rating stars
  getRatingStars(rating: number = 0): number[] {
    const stars = Math.round(rating);
    return Array(5).fill(0).map((_, i) => i < stars ? 1 : 0);
  }
}
