import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';

interface Prescription {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  notes?: string;
  prescribed_date: string;
  status: 'active' | 'completed' | 'cancelled';
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
  appointment?: {
    id: number;
    appointment_date: string;
  };
}

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescriptions.html',
  styleUrl: './prescriptions.scss'
})
export class Prescriptions implements OnInit {
  prescriptions: Prescription[] = [];
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
  selectedPrescription: Prescription | null = null;
  showDetailsModal = false;

  // Backend Pagination
  currentPage: number = 1;
  totalItems: number = 0;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchPrescriptions(1);
  }

  fetchPrescriptions(page: number = 1): void {
    const params: any = { page, per_page: 8 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    if (this.selectedStatus !== 'all') params.status = this.selectedStatus;

    this.loading = true;
    this.error = null;

    this.patientService.getPrescriptions(params, true).subscribe({
      next: (response: any) => {
        const responseData = response.data;
        // Check if response.data is the paginated object containing 'data' array
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          this.prescriptions = responseData.data;
          this.currentPage = responseData.current_page || 1;
          this.totalItems = responseData.total || 0;
          this.hasNextPage = responseData.current_page < responseData.last_page;
          this.hasPreviousPage = responseData.current_page > 1;
        } else if (Array.isArray(responseData)) {
          // Fallback if it is a plain array
          this.prescriptions = responseData;
          this.totalItems = responseData.length;
        } else {
          this.prescriptions = [];
        }

        this.extractDoctors();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load prescriptions.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  extractDoctors(): void {
    const uniqueDoctors = new Set<string>();
    this.prescriptions.forEach(prescription => {
      if (prescription.doctor?.user?.name) {
        uniqueDoctors.add(prescription.doctor.user.name);
      }
    });
    this.doctors = Array.from(uniqueDoctors).sort();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.fetchPrescriptions(1);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchPrescriptions(1);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDoctor = '';
    this.selectedStatus = 'all';
    this.currentPage = 1;
    this.fetchPrescriptions(1);
  }

  viewDetails(prescription: Prescription): void {
    this.selectedPrescription = prescription;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPrescription = null;
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

  nextPage(): void {
    if (this.hasNextPage) {
      this.fetchPrescriptions(this.currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.fetchPrescriptions(this.currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getRecordAge(prescribedDate: string): string {
    const prescribed = new Date(prescribedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - prescribed.getTime());
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
    const labels: { [key: string]: string } = {
      'active': 'Active',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all');
  }

  retryLoad(): void {
    this.fetchPrescriptions(this.currentPage);
  }
}
