import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../services/patient.service';

interface MedicalHistoryRecord {
  id: number;
  condition: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  visit_date: string;
  doctor: {
    id: number;
    user: {
      name: string;
      email: string;
    };
    specialization?: {
      name: string;
    };
  };
}

@Component({
  selector: 'app-medical-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-history.html',
  styleUrl: './medical-history.scss'
})
export class MedicalHistory implements OnInit {
  medicalHistory: MedicalHistoryRecord[] = [];
  filteredHistory: MedicalHistoryRecord[] = [];
  loading = true;
  error: string | null = null;
  
  // Search and filter
  searchQuery: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  selectedDoctor: string = '';
  doctors: string[] = [];
  
  // View details
  selectedRecord: MedicalHistoryRecord | null = null;
  showDetailsModal = false;
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private patientService: PatientService) { }

  ngOnInit(): void {
    this.fetchMedicalHistory();
  }

  fetchMedicalHistory(): void {
    this.loading = true;
    this.error = null;
    
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    
    this.patientService.getMedicalHistory(params).subscribe({
      next: (response: any) => {
        // Backend uses ApiResponse trait which returns { success, message, data }
        this.medicalHistory = Array.isArray(response.data) ? response.data : [];
        this.filteredHistory = [...this.medicalHistory];
        this.extractDoctors();
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load medical history.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  extractDoctors(): void {
    const uniqueDoctors = new Set<string>();
    this.medicalHistory.forEach(record => {
      if (record.doctor?.user?.name) {
        uniqueDoctors.add(record.doctor.user.name);
      }
    });
    this.doctors = Array.from(uniqueDoctors).sort();
  }

  applyFilters(): void {
    let filtered = [...this.medicalHistory];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.condition?.toLowerCase().includes(query) ||
        record.diagnosis?.toLowerCase().includes(query) ||
        record.treatment?.toLowerCase().includes(query) ||
        record.notes?.toLowerCase().includes(query)
      );
    }

    // Date filters
    if (this.dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.visit_date) >= new Date(this.dateFrom)
      );
    }
    if (this.dateTo) {
      filtered = filtered.filter(record => 
        new Date(record.visit_date) <= new Date(this.dateTo)
      );
    }

    // Doctor filter
    if (this.selectedDoctor) {
      filtered = filtered.filter(record =>
        record.doctor?.user?.name === this.selectedDoctor
      );
    }

    this.filteredHistory = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDoctor = '';
    this.applyFilters();
  }

  viewDetails(record: MedicalHistoryRecord): void {
    this.selectedRecord = record;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRecord = null;
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

  formatTime(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  getRecordAge(visitDate: string): string {
    const visit = new Date(visitDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - visit.getTime());
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
}
