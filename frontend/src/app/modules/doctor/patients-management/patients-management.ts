import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/services/auth';

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
  } | null;
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
      per_page: 15,
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
}
