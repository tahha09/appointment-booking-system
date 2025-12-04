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
  filteredPrescriptions: Prescription[] = [];
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

  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Check if we have filters applied
    const hasFilters = this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all';

    // If no filters, try to use cache (service will handle it)
    // If filters exist, fetch from API
    this.fetchPrescriptions(!hasFilters);
  }

  fetchPrescriptions(useCache: boolean = true): void {
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
    this.patientService.getPrescriptions(params, !useCache || hasFilters).subscribe({
      next: (response: any) => {
        this.prescriptions = Array.isArray(response.data) ? response.data : [];
        this.filteredPrescriptions = [...this.prescriptions];
        this.extractDoctors();
        this.applyFilters();
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

  applyFilters(): void {
    let filtered = [...this.prescriptions];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(prescription =>
        prescription.medication_name?.toLowerCase().includes(query) ||
        prescription.dosage?.toLowerCase().includes(query) ||
        prescription.frequency?.toLowerCase().includes(query) ||
        prescription.instructions?.toLowerCase().includes(query) ||
        prescription.notes?.toLowerCase().includes(query)
      );
    }

    // Date filters
    if (this.dateFrom) {
      filtered = filtered.filter(prescription =>
        new Date(prescription.prescribed_date) >= new Date(this.dateFrom)
      );
    }
    if (this.dateTo) {
      filtered = filtered.filter(prescription =>
        new Date(prescription.prescribed_date) <= new Date(this.dateTo)
      );
    }

    // Doctor filter
    if (this.selectedDoctor) {
      filtered = filtered.filter(prescription =>
        prescription.doctor?.user?.name === this.selectedDoctor
      );
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(prescription =>
        prescription.status === this.selectedStatus
      );
    }

    this.filteredPrescriptions = filtered;
  }

  onSearch(): void {
    // If search query exists, fetch from API, otherwise use cache
    if (this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all') {
      this.fetchPrescriptions(false);
    } else {
      this.applyFilters();
    }
  }

  onFilterChange(): void {
    // If filters exist, fetch from API, otherwise use cache
    if (this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all') {
      this.fetchPrescriptions(false);
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
    this.fetchPrescriptions(true);
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

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  getRecordAge(prescribedDate: string): string {
    const date = new Date(prescribedDate);
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
      case 'active':
        return 'status-active';
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
}
