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
  filteredAppointments: Appointment[] = [];
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

  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private notification: Notification
  ) { }

  ngOnInit(): void {
    // Check if we have filters applied
    const hasFilters = this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all';

    // If no filters, try to use cache (service will handle it)
    // If filters exist, fetch from API
    this.fetchAppointments(!hasFilters);
  }

  fetchAppointments(useCache: boolean = true): void {
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    if (this.selectedStatus !== 'all') params.status = this.selectedStatus;

    const hasFilters = Object.keys(params).length > 0;

    // Only show loading if we're fetching from API (not using cache)
    if (!useCache || hasFilters) {
      this.loading = true;
    }
    this.error = null;

    // forceRefresh = true only if we have filters (need fresh data)
    this.patientService.getAppointments(params, !useCache || hasFilters).subscribe({
      next: (response: any) => {
        this.appointments = Array.isArray(response.data.appointments) ? response.data.appointments : [];
        this.filteredAppointments = [...this.appointments];
        this.extractDoctors();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load appointments.';
        this.loading = false;
        console.error(err);
        if (this.error) {
          this.notification.error('Error Loading Appointments', this.error);
        }
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

  applyFilters(): void {
    let filtered = [...this.appointments];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.reason?.toLowerCase().includes(query) ||
        appointment.notes?.toLowerCase().includes(query) ||
        appointment.doctor?.user?.name?.toLowerCase().includes(query) ||
        appointment.doctor?.specialization?.name?.toLowerCase().includes(query)
      );
    }

    // Date filters
    if (this.dateFrom) {
      filtered = filtered.filter(appointment =>
        new Date(appointment.appointment_date) >= new Date(this.dateFrom)
      );
    }
    if (this.dateTo) {
      filtered = filtered.filter(appointment =>
        new Date(appointment.appointment_date) <= new Date(this.dateTo)
      );
    }

    // Doctor filter
    if (this.selectedDoctor) {
      filtered = filtered.filter(appointment =>
        appointment.doctor?.user?.name === this.selectedDoctor
      );
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(appointment =>
        appointment.status === this.selectedStatus
      );
    }

    this.filteredAppointments = filtered;
  }

  onSearch(): void {
    // If search query exists, fetch from API, otherwise use cache
    if (this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all') {
      this.fetchAppointments(false);
    } else {
      this.applyFilters();
    }
  }

  onFilterChange(): void {
    // If filters exist, fetch from API, otherwise use cache
    if (this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all') {
      this.fetchAppointments(false);
    } else {
      this.applyFilters();
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDoctor = '';
    this.selectedStatus = 'all';
    // Fetch all data again from cache
    this.fetchAppointments(true);
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
            this.fetchAppointments(false);
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
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
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
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  canCancel(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }


  retryLoad(): void {
    this.notification.confirm(
      'Retry Loading',
      'Do you want to reload appointments?',
      {
        confirmButtonText: 'Yes, Retry',
        cancelButtonText: 'Cancel'
      }
    ).then((result) => {
      if (result.isConfirmed) {
        this.fetchAppointments(false);
      }
    });
  }
}
