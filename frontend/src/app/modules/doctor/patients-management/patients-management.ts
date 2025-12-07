import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';

interface MedicalImageRecord {
  id: number;
  title: string;
  description?: string | null;
  image_type: string;
  images: string[];
  created_at: string;
}

interface Patient {
  id: number;
  user_id: number;
  emergency_contact: string;
  insurance_info: string;
  medical_history: string;
  blood_type: string;
  allergies: string;
  chronic_conditions: string;
  is_blocked: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    address: string;
    profile_image: string | null;
    profile_image_url?: string | null;
  } | null;
  medical_images?: MedicalImageRecord[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Component({
  selector: 'app-patients-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients-management.html',
  styleUrls: ['./patients-management.scss'],
})
export class PatientsManagement implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api';
  private readonly backendBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  patients: Patient[] = [];
  loading = true;
  error = '';
  pagination: Pagination | null = null;

  // Filters
  searchQuery: string = '';
  blockedFilter: string = 'all';

  // Actions
  blockingPatient: number | null = null;
  selectedPatient: Patient | null = null;
  showPatientModal = false;
  showMedicalHistoryModal = false;
  medicalHistory: any[] = [];
  patientDetailsLoading = false;
  patientDetailsError = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.fetchPatients();
  }

  fetchPatients(page: number = 1): void {
    this.loading = true;
    this.error = '';

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    let params: any = {
      page,
      per_page: 5,
    };

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    if (this.blockedFilter !== 'all') {
      params.blocked = this.blockedFilter;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.apiBase}/doctor/patients?${queryString}`;

    this.http
      .get<{ success: boolean; data: { patients: Patient[]; pagination: Pagination }; message: string }>(url, { headers })
      .subscribe({
        next: (res) => {
          this.patients = res.data?.patients ?? [];
          this.pagination = res.data?.pagination ?? null;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Unable to load patients.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    this.fetchPatients(1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.blockedFilter = 'all';
    this.fetchPatients(1);
  }

  blockPatient(patientId: number): void {
    if (this.blockingPatient === patientId) return;

    if (!confirm('Are you sure you want to block this patient? They will not be able to book appointments with you.')) {
      return;
    }

    this.blockingPatient = patientId;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiBase}/doctor/patients/${patientId}/block`,
        {},
        { headers }
      )
      .subscribe({
        next: () => {
          this.fetchPatients(this.pagination?.current_page || 1);
          this.blockingPatient = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to block patient.';
          this.blockingPatient = null;
          this.cdr.detectChanges();
        },
      });
  }

  unblockPatient(patientId: number): void {
    if (this.blockingPatient === patientId) return;

    this.blockingPatient = patientId;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiBase}/doctor/patients/${patientId}/unblock`,
        {},
        { headers }
      )
      .subscribe({
        next: () => {
          this.fetchPatients(this.pagination?.current_page || 1);
          this.blockingPatient = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to unblock patient.';
          this.blockingPatient = null;
          this.cdr.detectChanges();
        },
      });
  }

  viewPatientDetails(patient: Patient): void {
    this.selectedPatient = patient;
    this.showPatientModal = true;
    this.patientDetailsLoading = true;
    this.patientDetailsError = '';

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: Patient; message: string }>(
        `${this.apiBase}/doctor/patients/${patient.id}`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.selectedPatient = res.data;
          this.patientDetailsLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.patientDetailsError = err?.error?.message || 'Failed to load patient details.';
          this.patientDetailsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  viewMedicalHistory(patient: Patient): void {
    this.selectedPatient = patient;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: any[]; message: string }>(
        `${this.apiBase}/doctor/patients/${patient.id}/appointments`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.medicalHistory = res.data || [];
          this.showMedicalHistoryModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load medical history.';
          this.cdr.detectChanges();
        },
      });
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
    this.patientDetailsLoading = false;
    this.patientDetailsError = '';
  }

  closeMedicalHistoryModal(): void {
    this.showMedicalHistoryModal = false;
    this.medicalHistory = [];
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.last_page || 1)) {
      this.fetchPatients(page);
    }
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

  getMediaImageUrl(path: string): string {
    if (!path) {
      return 'assets/default-avatar.png';
    }

    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${this.backendBaseUrl}${path}`;
    }

    const normalized = path.startsWith('storage/') ? path : `storage/${path}`;
    return `${this.backendBaseUrl}/${normalized}`;
  }
}
