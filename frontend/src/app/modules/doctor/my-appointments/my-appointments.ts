import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string;
  notes: string;
  patient: {
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      profile_image: string | null;
    };
  };
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-appointments.html',
  styleUrls: ['./my-appointments.scss'],
})
export class MyAppointments implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api';
  appointments: Appointment[] = [];
  loading = true;
  error = '';
  pagination: Pagination | null = null;
  
  // Filters
  statusFilter: string = 'all';
  dateFrom: string = '';
  dateTo: string = '';
  
  // Status update
  updatingStatus: number | null = null;
  selectedPatient: any = null;
  showPatientModal = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAppointments();
  }

  fetchAppointments(page: number = 1): void {
    this.loading = true;
    this.error = '';

    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    
    let params: any = {
      page,
      per_page: 15,
    };

    if (this.statusFilter !== 'all') {
      params.status = this.statusFilter;
    }

    if (this.dateFrom) {
      params.date_from = this.dateFrom;
    }

    if (this.dateTo) {
      params.date_to = this.dateTo;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.apiBase}/doctor/appointments?${queryString}`;

    this.http
      .get<{ success: boolean; data: { appointments: Appointment[]; pagination: Pagination }; message: string }>(url, { headers })
      .subscribe({
        next: (res) => {
          this.appointments = res.data?.appointments ?? [];
          this.pagination = res.data?.pagination ?? null;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Unable to load appointments.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    this.fetchAppointments(1);
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.dateFrom = '';
    this.dateTo = '';
    this.fetchAppointments(1);
  }

  updateStatus(appointmentId: number, status: string): void {
    if (this.updatingStatus === appointmentId) return;

    this.updatingStatus = appointmentId;
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .put<{ success: boolean; data: Appointment; message: string }>(
        `${this.apiBase}/doctor/appointments/${appointmentId}/status`,
        { status },
        { headers }
      )
      .subscribe({
        next: () => {
          this.fetchAppointments(this.pagination?.current_page || 1);
          this.updatingStatus = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update appointment status.';
          this.updatingStatus = null;
          this.cdr.detectChanges();
        },
      });
  }

  confirmAppointment(appointmentId: number): void {
    this.updateStatus(appointmentId, 'confirmed');
  }

  completeAppointment(appointmentId: number): void {
    this.updateStatus(appointmentId, 'completed');
  }

  cancelAppointment(appointmentId: number): void {
    this.updateStatus(appointmentId, 'cancelled');
  }

  viewAppointmentDetails(appointment: Appointment): void {
    if (!appointment || !appointment.patient) {
      this.error = 'Appointment details not available.';
      return;
    }
    this.viewPatientDetails(appointment.patient);
  }

  viewPatientDetails(patient: any): void {
    this.selectedPatient = patient;
    this.showPatientModal = true;
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
      completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatTime(timeString: string): string {
    return timeString || 'N/A';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.last_page || 1)) {
      this.fetchAppointments(page);
    }
  }
}
