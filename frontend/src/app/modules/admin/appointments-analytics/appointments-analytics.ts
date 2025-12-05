import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';

interface AnalyticsOverview {
  total_appointments: number;
  todays_appointments: number;
  this_month_appointments: number;
  last_month_appointments: number;
  appointment_change_percent: number;
  total_revenue: number;
  this_month_revenue: number;
  last_month_revenue: number;
  revenue_change_percent: number;
  pending_payments: number;
  status_breakdown: { [key: string]: number };
}

interface TrendData {
  period: string;
  label: string;
  total_appointments: number;
  completed: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  revenue: number;
}

interface RevenueAnalytics {
  payment_methods: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
  revenue_by_month: Array<{
    month: string;
    label: string;
    revenue: number;
    payment_count: number;
  }>;
  today_revenue: number;
  this_week_revenue: number;
  average_payment: number;
  pending_payments: number;
}

interface DoctorPerformance {
  id: number;
  name: string;
  email: string;
  specialization: string;
  total_appointments: number;
  completed_appointments: number;
  pending_appointments: number;
  cancelled_appointments: number;
  total_revenue: number;
  this_month_revenue: number;
  average_rating: number;
  profile_image?: string;
}

interface PatientAnalytics {
  total_patients: number;
  new_patients_this_month: number;
  active_patients_this_month: number;
  avg_appointments_per_patient: number;
  top_patients: Array<{
    name: string;
    email: string;
    appointment_count: number;
  }>;
}

@Component({
  selector: 'app-appointments-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-analytics.html',
  styleUrls: ['./appointments-analytics.scss'],
})
export class AppointmentsAnalytics implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api';
  readonly chartWidth = 680;
  readonly chartHeight = 240;
  readonly chartPaddingLeft = 70;
  readonly chartPaddingRight = 30;
  readonly chartPaddingY = 30;
  readonly chartGridLines = [0, 1, 2, 3, 4];
  readonly gradientId = `analyticsTrendGradient-${Math.random().toString(36).substring(2, 9)}`;

  // Data
  overview: AnalyticsOverview | null = null;
  trends: TrendData[] = [];
  revenueAnalytics: RevenueAnalytics | null = null;
  doctorPerformance: DoctorPerformance[] = [];
  patientAnalytics: PatientAnalytics | null = null;

  // Loading states
  loading = {
    overview: true,
    trends: true,
    revenue: true,
    doctors: true,
    patients: true,
  };

  // Errors
  errors: { [key: string]: string } = {};

  // Active tab
  activeTab: 'overview' | 'trends' | 'revenue' | 'doctors' | 'patients' = 'overview';

  // Chart data
  maxAppointments = 0;
  maxRevenue = 0;

  // Filters
  trendPeriod: 'day' | 'month' = 'month';
  trendLimit = 12;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadTrends();
    this.loadRevenueAnalytics();
    this.loadDoctorPerformance();
    this.loadPatientAnalytics();
  }

  loadOverview(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.loading.overview = true;
    this.http
      .get<{ success: boolean; data: AnalyticsOverview; message: string }>(
        `${this.apiBase}/admin/analytics/overview`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.overview = res.data;
          this.loading.overview = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errors['overview'] = err?.error?.message || 'Unable to load analytics overview.';
          this.loading.overview = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadTrends(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.loading.trends = true;
    const params = `period=${this.trendPeriod}&limit=${this.trendLimit}`;

    this.http
      .get<{ success: boolean; data: { trends: TrendData[]; period: string }; message: string }>(
        `${this.apiBase}/admin/analytics/trends?${params}`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.trends = res.data.trends;
          this.calculateChartMaxValues();
          this.loading.trends = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errors['trends'] = err?.error?.message || 'Unable to load appointment trends.';
          this.loading.trends = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadRevenueAnalytics(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.loading.revenue = true;
    this.http
      .get<{ success: boolean; data: RevenueAnalytics; message: string }>(
        `${this.apiBase}/admin/analytics/revenue`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.revenueAnalytics = res.data;
          this.loading.revenue = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errors['revenue'] = err?.error?.message || 'Unable to load revenue analytics.';
          this.loading.revenue = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadDoctorPerformance(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.loading.doctors = true;
    this.http
      .get<{ success: boolean; data: { doctors: DoctorPerformance[]; total_doctors: number }; message: string }>(
        `${this.apiBase}/admin/analytics/doctors`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.doctorPerformance = res.data.doctors;
          this.loading.doctors = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errors['doctors'] = err?.error?.message || 'Unable to load doctor performance.';
          this.loading.doctors = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadPatientAnalytics(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.loading.patients = true;
    this.http
      .get<{ success: boolean; data: PatientAnalytics; message: string }>(
        `${this.apiBase}/admin/analytics/patients`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.patientAnalytics = res.data;
          this.loading.patients = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errors['patients'] = err?.error?.message || 'Unable to load patient analytics.';
          this.loading.patients = false;
          this.cdr.detectChanges();
        },
      });
  }

  calculateChartMaxValues(): void {
    if (this.trends.length > 0) {
      this.maxAppointments = Math.max(...this.trends.map((t) => t.total_appointments), 1);
      this.maxRevenue = Math.max(...this.trends.map((t) => t.revenue), 1);
    } else {
      this.maxAppointments = 1;
      this.maxRevenue = 1;
    }
  }

  // Chart methods
  get lineChartViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  getLinePoints(dataKey: 'total_appointments' | 'revenue'): string {
    if (!this.trends.length) return '';

    return this.trends
      .map((trend, index) => {
        const value = dataKey === 'total_appointments' ? trend.total_appointments : trend.revenue;
        return `${this.getPointX(index)},${this.getPointY(value, dataKey)}`;
      })
      .join(' ');
  }

  getAreaPath(dataKey: 'total_appointments' | 'revenue'): string {
    if (!this.trends.length) return '';

    const firstPointX = this.getPointX(0);
    const lastPointX = this.getPointX(this.trends.length - 1);
    const baseY = this.getBaselineY();

    const points = this.trends
      .map((trend, index) => {
        const value = dataKey === 'total_appointments' ? trend.total_appointments : trend.revenue;
        return `L ${this.getPointX(index)} ${this.getPointY(value, dataKey)}`;
      })
      .join(' ');

    return `M ${firstPointX} ${baseY} ${points} L ${lastPointX} ${baseY} Z`;
  }

  getPointX(index: number): number {
    const count = this.trends.length;
    const availableWidth = this.chartWidth - (this.chartPaddingLeft + this.chartPaddingRight);

    if (count <= 1) {
      return this.chartPaddingLeft + availableWidth / 2;
    }

    return this.chartPaddingLeft + (index / (count - 1)) * availableWidth;
  }

  getPointY(value: number, dataKey: 'total_appointments' | 'revenue'): number {
    const maxValue = dataKey === 'total_appointments' ? this.maxAppointments : this.maxRevenue;
    const availableHeight = this.chartHeight - this.chartPaddingY * 2;

    if (maxValue <= 0) return this.getBaselineY();

    const ratio = value / maxValue;
    return this.chartPaddingY + (1 - ratio) * availableHeight;
  }

  getGridLineY(index: number): number {
    if (this.chartGridLines.length <= 1) {
      return this.chartHeight - this.chartPaddingY;
    }

    const availableHeight = this.chartHeight - this.chartPaddingY * 2;
    const step = availableHeight / (this.chartGridLines.length - 1);

    return this.chartPaddingY + index * step;
  }

  getGridLabel(index: number, dataKey: 'total_appointments' | 'revenue'): string {
    const maxValue = dataKey === 'total_appointments' ? this.maxAppointments : this.maxRevenue;

    if (this.chartGridLines.length <= 1 || maxValue <= 0) {
      return dataKey === 'total_appointments' ? '0' : '$0.00';
    }

    const steps = this.chartGridLines.length - 1;
    const ratio = 1 - index / steps;
    const value = maxValue * ratio;

    return dataKey === 'total_appointments' ? Math.round(value).toString() : this.formatCurrency(value);
  }

  getBaselineY(): number {
    return this.chartHeight - this.chartPaddingY;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }

  // Event handlers
  setActiveTab(tab: 'overview' | 'trends' | 'revenue' | 'doctors' | 'patients'): void {
    this.activeTab = tab;
  }

  onTrendPeriodChange(): void {
    this.trendLimit = this.trendPeriod === 'day' ? 30 : 12;
    this.loadTrends();
  }

  refreshData(): void {
    this.errors = {};
    this.loadOverview();
    this.loadTrends();
    this.loadRevenueAnalytics();
    this.loadDoctorPerformance();
    this.loadPatientAnalytics();
  }
}
