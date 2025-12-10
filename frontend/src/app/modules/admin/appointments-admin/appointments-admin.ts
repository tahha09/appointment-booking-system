import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PaginatedResponse, Appointment } from '../../../core/services/admin';
import {  } from '@angular/core';
@Component({
  selector: 'app-appointments-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-admin.html',
  styleUrl: './appointments-admin.scss',
})
export class AppointmentsAdmin implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  // Appointments data
  appointments: Appointment[] = [];
  pagination = {
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
    from: null as number | null,
    to: null as number | null
  };

  // UI state
  isLoading = false;
  hasError = false;

  // Search and filters
  searchTerm = '';
  statusFilter: string = 'ALL';
  paymentStatusFilter: string = 'ALL';

  // Modal states
  selectedAppointment: Appointment | null = null;
  showViewModal = false;
  showDeleteConfirmModal = false;
  appointmentToDelete: Appointment | null = null;
  deleteResultSuccess: boolean | null = null;
  deleteResultMessage = '';

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.hasError = false;

    const params: any = {
      per_page: 5,
      page: this.pagination.current_page
    };

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    if (this.statusFilter && this.statusFilter !== 'ALL') {
      params.status = this.statusFilter;
    }

    if (this.paymentStatusFilter && this.paymentStatusFilter !== 'ALL') {
      params.payment_status = this.paymentStatusFilter;
    }

    this.adminService.getAppointments(params).subscribe({
      next: (response: PaginatedResponse<Appointment>) => {
        this.appointments = response.data || [];
        this.pagination = {
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 5,
          total: response.total || 0,
          from: response.from,
          to: response.to
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load appointments:', error);
        this.appointments = [];
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    // Reset to first page when searching
    this.pagination.current_page = 1;
    this.loadAppointments();
  }

  onStatusFilterChange(): void {
    // Reset to first page when filtering
    this.pagination.current_page = 1;
    this.loadAppointments();
  }

  onPaymentStatusFilterChange(): void {
    // Reset to first page when filtering
    this.pagination.current_page = 1;
    this.loadAppointments();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadAppointments();
    }
  }

  viewAppointment(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedAppointment = null;
  }

  openDeleteConfirm(appointment: Appointment): void {
    this.appointmentToDelete = appointment;
    this.showDeleteConfirmModal = true;
    this.deleteResultSuccess = null;
    this.deleteResultMessage = '';
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.appointmentToDelete = null;
  }

  confirmDelete(): void {
    if (!this.appointmentToDelete) {
      return;
    }

    const appointmentId = this.appointmentToDelete.id;
    this.showDeleteConfirmModal = false;

    this.adminService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        this.deleteResultSuccess = true;
        this.deleteResultMessage = `Appointment has been deleted successfully.`;
        this.showDeleteConfirmModal = false;
        this.appointmentToDelete = null;
        // Reload appointments
        this.loadAppointments();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to delete appointment:', error);
        this.deleteResultSuccess = false;
        this.deleteResultMessage = `Failed to delete appointment. Please try again.`;
        this.showDeleteConfirmModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'N/A';
    // Assuming time is in HH:mm:ss format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.pagination.last_page;
    const currentPage = this.pagination.current_page;
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at boundaries
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      // Add ellipsis after first if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }
}
