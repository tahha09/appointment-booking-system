import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { Notification } from '../../../core/services/notification';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  doctor?: {
    id: number;
    user?: {
      name: string;
      email: string;
      profile_image?: string;
    } | null;
    specialization?: {
      name: string;
    } | null;
  } | null;
}

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.scss'
})
export class MyAppointments implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  error: string | null = null;

  // Search and filter
  searchQuery: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  selectedDoctor: string = '';
  selectedStatus: string = 'all';
  doctors: string[] = [];

  // View details
  selectedAppointment: Appointment | null = null;
  showDetailsModal = false;

  // Backend Pagination
  currentPage: number = 1;
  totalItems: number = 0;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;
  itemsPerPage: number = 8;

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private notification: Notification
  ) { }

  ngOnInit(): void {
    this.fetchAppointments(1);
  }

  fetchAppointments(page: number = 1): void {
    const params: any = { page, per_page: this.itemsPerPage };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    if (this.selectedStatus !== 'all') params.status = this.selectedStatus;

    this.loading = true;
    this.error = null;

    this.patientService.getAppointments(params, true).subscribe({
      next: (response: any) => {
        const responseData = response.data;
        // Handle paginated response structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          this.appointments = responseData.data;
          this.currentPage = responseData.current_page || 1;
          this.totalItems = responseData.total || 0;
          this.hasNextPage = responseData.current_page < responseData.last_page;
          this.hasPreviousPage = responseData.current_page > 1;
        } else if (Array.isArray(responseData)) {
          // Fallback for plain array
          this.appointments = responseData;
          this.totalItems = responseData.length;
        } else {
          this.appointments = [];
        }

        this.extractDoctors();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load appointments.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  extractDoctors(): void {
    const uniqueDoctors = new Set<string>();
    this.appointments.forEach(appointment => {
      if (appointment.doctor?.user?.name) {
        uniqueDoctors.add(appointment.doctor.user.name);
      }
    });
    this.doctors = Array.from(uniqueDoctors).sort();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.fetchAppointments(1);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchAppointments(1);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDoctor = '';
    this.selectedStatus = 'all';
    this.currentPage = 1;
    this.fetchAppointments(1);
  }

  viewDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  cancelAppointment(id: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.notification.confirm(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      {
        confirmButtonText: 'Yes, Cancel',
        cancelButtonText: 'Keep Appointment'
      }
    ).then((result) => {
      if (result.isConfirmed) {
        const token = sessionStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`http://localhost:8000/api/patient/appointments/${id}/cancel`, {
          method: 'PUT',
          headers: headers
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              this.notification.success('Success', 'Appointment cancelled successfully!');
              this.fetchAppointments(this.currentPage);
              if (this.showDetailsModal) {
                this.closeDetailsModal();
              }
            } else {
              this.notification.error('Error', data.message || 'Failed to cancel appointment');
            }
          })
          .catch(err => {
            console.error('Error cancelling appointment:', err);
            this.notification.error('Error', 'Failed to cancel appointment. Please try again.');
          });
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.fetchAppointments(this.currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.fetchAppointments(this.currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getRecordAge(appointmentDate: string): string {
    const date = new Date(appointmentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  canCancel(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all');
  }

  retryLoad(): void {
    this.fetchAppointments(this.currentPage);
  }
}
