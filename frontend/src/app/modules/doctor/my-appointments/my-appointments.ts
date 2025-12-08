import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { environment } from '../../../../environments/environment';

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
  patient?: {
    user?: {
      id: number;
      name: string;
      email: string;
      phone: string;
      profile_image: string | 'assets/default-avatar.png' | null;
      profile_image_url?: string |'assets/default-avatar.png' | null;
    } | null;
  } | null;
  // optional payment info (may be returned at top-level or nested)
  amount?: number;
  payment_method?: string;
  payment_details?: any;
  payment?: {
    amount?: number;
    payment_method?: string;
    payment_details?: any;
  } | null;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type PrescriptionStatus = 'active' | 'completed' | 'cancelled';

interface PrescriptionForm {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes: string;
  prescribed_date: string;
  status: PrescriptionStatus;
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
  private readonly backendBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  private readonly notification = inject(Notification);
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
  showPrescriptionModal = false;
  prescriptionForm: PrescriptionForm = this.createDefaultPrescriptionForm();
  prescriptionStatuses: PrescriptionStatus[] = ['active', 'completed', 'cancelled'];
  selectedAppointmentForPrescription: Appointment | null = null;
  savingPrescription = false;
  prescriptionError = '';
  // Patient details UI state used by the template
  patientDetailsLoading = false;
  patientDetailsError = '';

  // Image modal state for medical images
  showImageModal = false;
  selectedImageForModal: string | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.fetchAppointments();
  }

  fetchAppointments(page: number = 1): void {
    this.loading = true;
    this.error = '';

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    let params: any = {
      page,
      per_page: 5,
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
    const token = this.auth.getToken();
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

  completeAppointment(appointment: Appointment): void {
    this.openPrescriptionModal(appointment);
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

  openPrescriptionModal(appointment: Appointment): void {
    const defaultForm = this.createDefaultPrescriptionForm();
    defaultForm.notes = appointment.notes || '';
    this.prescriptionForm = defaultForm;
    this.selectedAppointmentForPrescription = appointment;
    this.prescriptionError = '';
    this.showPrescriptionModal = true;
  }

  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
    this.selectedAppointmentForPrescription = null;
    this.prescriptionForm = this.createDefaultPrescriptionForm();
    this.savingPrescription = false;
    this.prescriptionError = '';
  }

  submitPrescription(): void {
    if (!this.selectedAppointmentForPrescription) {
      this.prescriptionError = 'No appointment selected.';
      return;
    }

    if (!this.isPrescriptionFormValid()) {
      this.prescriptionError = 'Please fill in all required fields to save the prescription.';
      return;
    }

    this.savingPrescription = true;
    this.prescriptionError = '';

    const appointmentId = this.selectedAppointmentForPrescription.id;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    const payload = {
      medication_name: this.prescriptionForm.medication_name.trim(),
      dosage: this.prescriptionForm.dosage.trim(),
      frequency: this.prescriptionForm.frequency.trim(),
      duration: this.prescriptionForm.duration.trim(),
      instructions: this.prescriptionForm.instructions?.trim() || null,
      notes: this.prescriptionForm.notes?.trim() || null,
      prescribed_date: this.prescriptionForm.prescribed_date,
      status: this.prescriptionForm.status,
    };

    this.http
      .post<{ success: boolean; data: any; message: string }>(
        `${this.apiBase}/doctor/appointments/${appointmentId}/prescriptions`,
        payload,
        { headers }
      )
      .subscribe({
        next: () => {
          this.notification.success('Prescription Saved', 'Prescription recorded and appointment marked as completed.');
          const currentPage = this.pagination?.current_page || 1;
          this.closePrescriptionModal();
          this.fetchAppointments(currentPage);
          this.savingPrescription = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.prescriptionError = err?.error?.message || 'Failed to save prescription.';
          this.savingPrescription = false;
          this.cdr.detectChanges();
        },
      });
  }

  private isPrescriptionFormValid(): boolean {
    return Boolean(
      this.prescriptionForm.medication_name.trim() &&
      this.prescriptionForm.dosage.trim() &&
      this.prescriptionForm.frequency.trim() &&
      this.prescriptionForm.duration.trim()
    );
  }

  getUserImage(user?: { profile_image?: string | null; profile_image_url?: string | null } | null): string {
    const fallback = 'assets/default-avatar.png';
    if (!user) {
      return fallback;
    }

    const source = user.profile_image_url || user.profile_image;
    if (!source) {
      return fallback;
    }

    if (/^(https?:)?\/\//.test(source) || source.startsWith('data:')) {
      return source;
    }

    if (source.startsWith('/')) {
      return `${this.backendBaseUrl}${source}`;
    }

    const normalized = source.startsWith('storage/') ? source : `storage/${source}`;
    return `${this.backendBaseUrl}/${normalized}`;
  }

  private createDefaultPrescriptionForm(): PrescriptionForm {
    return {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      notes: '',
      prescribed_date: this.getTodayDateString(),
      status: 'active',
    };
  }

  private getTodayDateString(): string {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().split('T')[0];
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      confirmed: 'bg-green-500/10 text-green-500 border-green-500/30',
      completed: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  }

  getMediaImageUrl(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) return '';
    if (/^(https?:)?\/\//.test(pathOrUrl) || pathOrUrl.startsWith('data:')) return pathOrUrl;
    const normalized = pathOrUrl.startsWith('storage/') ? pathOrUrl : `storage/${pathOrUrl}`;
    return `${this.backendBaseUrl}/${normalized}`;
  }

  openImageModal(photo: string | null | undefined): void {
    this.selectedImageForModal = this.getMediaImageUrl(photo ?? '');
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImageForModal = null;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.last_page || 1)) {
      this.fetchAppointments(page);
    }
  }
}
