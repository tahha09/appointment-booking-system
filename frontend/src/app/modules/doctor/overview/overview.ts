import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Auth } from '../../../core/services/auth';

type AppointmentStatusType = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentStatusDefinition {
  status: AppointmentStatusType;
  label: string;
  color: string;
}

interface AppointmentStatusSummaryItem extends AppointmentStatusDefinition {
  value: number;
  percentage: number;
}

interface AppointmentListResponse {
  data?: {
    appointments?: Array<unknown>;
    pagination?: {
      current_page?: number;
      last_page?: number;
      per_page?: number;
      total?: number;
    };
  };
  success?: boolean;
  message?: string;
}

interface DoctorDashboardResponse {
  success?: boolean;
  data?: {
    today_appointments?: number;
    upcoming_appointments?: number;
    total_patients?: number;
  };
  message?: string;
}

interface FinancialOverviewSummary {
  total_revenue?: number;
  this_month_revenue?: number;
  last_month_revenue?: number;
  revenue_change_percent?: number;
}

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
  appointmentStatusSummary: AppointmentStatusSummaryItem[] = [];
  appointmentStatusTotal = 0;
  appointmentStatusLoading = true;
  appointmentStatusError = '';
  appointmentStatusGradient = 'conic-gradient(#032f30 0% 100%)';
  totalPatients = 0;
  totalPatientsLoading = true;
  totalPatientsError = '';
  totalRevenue = 0;
  totalRevenueLoading = true;
  totalRevenueError = '';

  private readonly appointmentStatusDefinitions: AppointmentStatusDefinition[] = [
    { status: 'pending', label: 'Pending', color: '#6ba3be' },
    { status: 'confirmed', label: 'Confirmed', color: '#0c969c' },
    { status: 'completed', label: 'Completed', color: '#0a7075' },
    { status: 'cancelled', label: 'Cancelled', color: '#031716' },
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.fetchPatientCounts();
    this.fetchAppointmentStatusSummary();
    this.fetchDoctorDashboardSummary();
    this.fetchFinancialOverviewSummary();
  }

  trackByMonth(index: number, item: { month: string; value: number; label: string }): string {
    return item.month;
  }

  trackByStatus(index: number, item: AppointmentStatusSummaryItem): string {
    return item.status;
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
      const month = String(date.getMonth() + 1).padStart(2, '0');
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

  private fetchAppointmentStatusSummary(): void {
    this.appointmentStatusLoading = true;
    this.appointmentStatusError = '';

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const options = headers ? { headers } : {};

    let partialError = false;

    const statusRequests = this.appointmentStatusDefinitions.reduce(
      (acc, def) => {
        const url = `${this.apiBase}/doctor/appointments?status=${def.status}&per_page=1`;
        acc[def.status] = this.http
          .get<AppointmentListResponse>(url, options)
          .pipe(
            catchError((error) => {
              partialError = true;
              return of<AppointmentListResponse>({
                data: { pagination: { total: 0 } },
                message: error?.error?.message || error?.message,
              });
            })
          );
        return acc;
      },
      {} as Record<AppointmentStatusType, Observable<AppointmentListResponse>>
    );

    forkJoin(statusRequests).subscribe({
      next: (responses) => {
        this.appointmentStatusSummary = this.appointmentStatusDefinitions.map((definition) => {
          const response = responses[definition.status];
          const value = response?.data?.pagination?.total ?? 0;
          return { ...definition, value, percentage: 0 };
        });

        this.appointmentStatusTotal = this.appointmentStatusSummary.reduce((sum, item) => sum + item.value, 0);

        this.appointmentStatusSummary = this.appointmentStatusSummary.map((item) => ({
          ...item,
          percentage: this.appointmentStatusTotal > 0
            ? Math.round((item.value / this.appointmentStatusTotal) * 100)
            : 0,
        }));

        this.appointmentStatusGradient = this.buildAppointmentStatusGradient();
        this.appointmentStatusLoading = false;
        if (partialError) {
          this.appointmentStatusError = 'Some status counts may be unavailable. Showing partial data.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.appointmentStatusSummary = this.appointmentStatusDefinitions.map((definition) => ({
          ...definition,
          value: 0,
          percentage: 0,
        }));
        this.appointmentStatusTotal = 0;
        this.appointmentStatusGradient = 'conic-gradient(#032f30 0% 100%)';
        this.appointmentStatusLoading = false;
        this.appointmentStatusError =
          err?.error?.message ||
          err?.message ||
          'Unable to load appointment status summary.';
        this.cdr.detectChanges();
      },
    });
  }

  private fetchDoctorDashboardSummary(): void {
    this.totalPatientsLoading = true;
    this.totalPatientsError = '';

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const options = headers ? { headers } : {};

    this.http
      .get<DoctorDashboardResponse>(`${this.apiBase}/doctor/dashboard`, options)
      .subscribe({
        next: (res) => {
          this.totalPatients = res?.data?.total_patients ?? 0;
          this.totalPatientsLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.totalPatients = 0;
          this.totalPatientsLoading = false;
          this.totalPatientsError =
            err?.error?.message ||
            err?.message ||
            'Unable to load patient summary.';
          this.cdr.detectChanges();
        },
      });
  }

  private fetchFinancialOverviewSummary(): void {
    this.totalRevenueLoading = true;
    this.totalRevenueError = '';

    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const options = headers ? { headers } : {};

    this.http
      .get<{ success?: boolean; data?: FinancialOverviewSummary; message?: string }>(
        `${this.apiBase}/doctor/financial/overview`,
        options
      )
      .subscribe({
        next: (res) => {
          this.totalRevenue = res?.data?.total_revenue ?? 0;
          this.totalRevenueLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.totalRevenue = 0;
          this.totalRevenueLoading = false;
          this.totalRevenueError =
            err?.error?.message ||
            err?.message ||
            'Unable to load revenue summary.';
          this.cdr.detectChanges();
        },
      });
  }

  private buildAppointmentStatusGradient(): string {
    if (this.appointmentStatusTotal === 0) {
      return 'conic-gradient(#032f30 0% 100%)';
    }

    const fallbackColor = '#032f30';
    let cumulative = 0;
    const segments = this.appointmentStatusSummary
      .filter((item) => item.value > 0)
      .map((item) => {
        const start = cumulative;
        const sweep = (item.value / this.appointmentStatusTotal) * 100;
        cumulative += sweep;
        return `${item.color} ${start}% ${cumulative}%`;
      });

    if (!segments.length) {
      return `conic-gradient(${fallbackColor} 0% 100%)`;
    }

    if (cumulative < 100) {
      segments.push(`${fallbackColor} ${cumulative}% 100%`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  }

  formatCurrency(amount: number): string {
    if (typeof amount !== 'number') {
      amount = Number(amount) || 0;
    }
    return new Intl.NumberFormat('Egypt', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
