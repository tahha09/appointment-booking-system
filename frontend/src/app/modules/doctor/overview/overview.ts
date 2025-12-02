import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-doctor-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrls: ['./overview.scss'],
})
export class DoctorOverview implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api';
  patientCounts: Array<{ label: string; value: number; month: string }> = [];
  loading = true;
  error = '';
  maxValue = 0;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.fetchPatientCounts();
  }

  trackByMonth(index: number, item: { month: string; value: number; label: string }): string {
    return item.month;
  }

  getBarHeight(count: number): string {
    if (this.maxValue === 0 || count === 0) {
      return '0px';
    }
    const pct = Math.round((count / this.maxValue) * 100);
    // Calculate height based on minimum height for visibility
    const minHeight = 20; // Minimum height in pixels for visibility
    const maxHeight = 180; // Maximum height in pixels
    const height = Math.max(minHeight, (pct / 100) * maxHeight);
    return `${height}px`;
  }

  /**
   * Generate array of last 6 months in YYYY-MM format
   */
  private generateLast6Months(): string[] {
    const months: string[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 2).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    
    return months;
  }

  /**
   * Format month key (YYYY-MM) to display label
   */
  private formatMonthLabel(monthKey: string): string {
    const parsed = new Date(`${monthKey}-01`);
    if (isNaN(parsed.getTime())) {
      return monthKey;
    }
    return parsed.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  private fetchPatientCounts(): void {
    this.loading = true;
    this.error = '';
    this.patientCounts = [];

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const options = headers ? { headers } : {};

    this.http
      .get<{ data?: Array<{ month: string; patient_count: number }>; message?: string }>(
        `${this.apiBase}/doctor/overview/patient-counts`,
        options
      )
      .subscribe({
        next: (res) => {
          const raw = res?.data ?? [];
          
          // Generate all 6 months
          const allMonths = this.generateLast6Months();
          
          // Create a map of month -> patient_count from API response
          const dataMap = new Map<string, number>();
          raw.forEach((item) => {
            dataMap.set(item.month, item.patient_count ?? 0);
          });
          
          // Build patientCounts array with all 6 months, filling missing ones with 0
          this.patientCounts = allMonths.map((monthKey) => {
            return {
              month: monthKey,
              value: dataMap.get(monthKey) ?? 0,
              label: this.formatMonthLabel(monthKey),
            };
          });
          
          // Calculate max value for bar height scaling
          this.maxValue = this.patientCounts.length > 0 
            ? Math.max(...this.patientCounts.map(item => item.value), 1)
            : 1; // Use 1 as minimum to avoid division by zero
          
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          
          // Even on error, show empty chart with 6 months
          const allMonths = this.generateLast6Months();
          this.patientCounts = allMonths.map((monthKey) => ({
            month: monthKey,
            value: 0,
            label: this.formatMonthLabel(monthKey),
          }));
          this.maxValue = 1;
          
          // Set error message but don't prevent chart from showing
          this.error =
            err?.error?.message ||
            err?.message ||
            'Unable to load patient counts. Showing empty chart.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
