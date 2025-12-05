import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { MedicalAiService } from '../../../core/services/medical-ai';

interface MedicalHistoryRecord {
  id: number;
  condition: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  visit_date: string;
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
  selector: 'app-medical-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  // Tab navigation
  activeTab: 'records' | 'chat' = 'records';

  // Chat history
  chatMessages: any[] = [];
  chatStats: any = {};
  chatLoading = false;
  chatError: string | null = null;

  constructor(
    private patientService: PatientService,
    private medicalAiService: MedicalAiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Check if we have filters applied
    const hasFilters = this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor;

    // If no filters, try to use cache (service will handle it)
    // If filters exist, fetch from API
    this.fetchMedicalHistory(!hasFilters);
  }

  fetchMedicalHistory(useCache: boolean = true): void {
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;

    const hasFilters = Object.keys(params).length > 0;

    // Only show loading if we're fetching from API (not using cache)
    if (!useCache || hasFilters) {
      this.loading = true;
    }
    this.error = null;

    // forceRefresh = true only if we have filters (need fresh data)
    this.patientService.getMedicalHistory(params, !useCache || hasFilters).subscribe({
      next: (response: any) => {
        // Backend uses ApiResponse trait which returns { success, message, data }
        this.medicalHistory = Array.isArray(response.data) ? response.data : [];
        this.filteredHistory = [...this.medicalHistory];
        this.extractDoctors();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
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
    // If search query exists, fetch from API, otherwise use cache
    if (this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor) {
      this.fetchMedicalHistory(false);
    } else {
      this.applyFilters();
    }
  }

  onFilterChange(): void {
    // If filters exist, fetch from API, otherwise use cache
    if (this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor) {
      this.fetchMedicalHistory(false);
    } else {
      this.applyFilters();
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDoctor = '';
    // Fetch all data again from cache
    this.fetchMedicalHistory(true);
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

  // Tab switching
  switchTab(tab: 'records' | 'chat'): void {
    this.activeTab = tab;

    if (tab === 'chat' && this.chatMessages.length === 0 && !this.chatError) {
      this.loadChatHistory();
    }

    this.cdr.detectChanges();
  }

  // Chat history methods
  loadChatHistory(): void {
    this.chatLoading = true;
    this.chatError = null;

    this.medicalAiService.getChatHistory().subscribe({
      next: (response) => {
        this.chatLoading = false;
        if (response.success) {
          this.chatMessages = response.messages || [];
          this.chatStats = response.stats || {};
        } else {
          this.chatError = 'Failed to load chat history';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.chatLoading = false;
        this.chatError = error?.error?.message || 'Failed to load chat history';
        console.error('Chat history error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  refreshChatHistory(): void {
    this.loadChatHistory();
  }

  formatChatTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatChatMessage(content: string): string {
    if (!content) return '';

    // Basic HTML sanitization and formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/•/g, '<span class="bullet">•</span>'); // Bullets
  }
}