import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';

interface FinancialOverview {
  total_revenue: number;
  this_month_revenue: number;
  last_month_revenue: number;
  revenue_change_percent: number;
  total_payments: number;
  pending_payments: number;
  this_month_payments: number;
}

interface RevenueByMonth {
  month: string;
  label: string;
  revenue: number;
  payment_count: number;
}

interface Payment {
  id: number;
  appointment_id: number;
  patient_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  paid_at: string;
  appointment?: {
    patient?: {
      user?: {
        name: string;
        email: string;
      };
    };
  };
  patient?: {
    user?: {
      name: string;
      email: string;
    };
  };
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Statistics {
  today_revenue: number;
  this_week_revenue: number;
  average_payment: number;
  payment_methods: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
}

@Component({
  selector: 'app-financial-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-performance.html',
  styleUrls: ['./financial-performance.scss'],
})
export class FinancialPerformance implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api';
  readonly chartWidth = 680;
  readonly chartHeight = 240;
  readonly chartPaddingLeft = 70;
  readonly chartPaddingRight = 30;
  readonly chartPaddingY = 30;
  readonly chartGridLines = [0, 1, 2, 3, 4];
  readonly gradientId = `revenueTrendGradient-${Math.random().toString(36).substring(2, 9)}`;
  overview: FinancialOverview | null = null;
  revenueByMonth: RevenueByMonth[] = [];
  payments: Payment[] = [];
  statistics: Statistics | null = null;
  loading = true;
  error = '';
  pagination: Pagination | null = null;
  maxRevenue = 0;

  // Filters
  statusFilter: string = 'all';
  dateFrom: string = '';
  dateTo: string = '';

  // Active tab
  activeTab: 'overview' | 'history' | 'statistics' = 'overview';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadRevenueByPeriod();
    this.loadStatistics();
    this.fetchPayments();
  }

  loadOverview(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: FinancialOverview; message: string }>(
        `${this.apiBase}/doctor/financial/overview`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.overview = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Unable to load financial overview.';
          this.cdr.detectChanges();
        },
      });
  }

  loadRevenueByPeriod(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: { revenue_by_month: RevenueByMonth[] }; message: string }>(
        `${this.apiBase}/doctor/financial/revenue-by-period`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          const rawData = res.data?.revenue_by_month ?? [];
          const monthKeys = this.generateLast6Months();
          const revenueMap = new Map<
            string,
            { revenue: number; payment_count: number; label?: string }
          >();

          rawData.forEach((item) => {
            if (!item?.month) {
              return;
            }
            revenueMap.set(item.month, {
              revenue: item.revenue ?? 0,
              payment_count: item.payment_count ?? 0,
              label: item.label,
            });
          });

          this.revenueByMonth = monthKeys.map((monthKey) => {
            const mapped = revenueMap.get(monthKey);
            return {
              month: monthKey,
              label: mapped?.label ?? this.formatMonthLabel(monthKey),
              revenue: mapped?.revenue ?? 0,
              payment_count: mapped?.payment_count ?? 0,
            };
          });

          this.maxRevenue =
            this.revenueByMonth.length > 0
              ? Math.max(...this.revenueByMonth.map((m) => m.revenue), 1)
              : 1;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Unable to load revenue data.';
          const monthKeys = this.generateLast6Months();
          this.revenueByMonth = monthKeys.map((monthKey) => ({
            month: monthKey,
            label: this.formatMonthLabel(monthKey),
            revenue: 0,
            payment_count: 0,
          }));
          this.maxRevenue = 1;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadStatistics(): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: Statistics; message: string }>(
        `${this.apiBase}/doctor/financial/statistics`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.statistics = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          // Don't show error for statistics, just log it
          console.error('Failed to load statistics:', err);
        },
      });
  }

  fetchPayments(page: number = 1): void {
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
    const url = `${this.apiBase}/doctor/financial/payment-history?${queryString}`;

    this.http
      .get<{ success: boolean; data: { payments: Payment[]; pagination: Pagination }; message: string }>(
        url,
        { headers }
      )
      .subscribe({
        next: (res) => {
          this.payments = res.data?.payments ?? [];
          this.pagination = res.data?.pagination ?? null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Unable to load payment history.';
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    this.fetchPayments(1);
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.dateFrom = '';
    this.dateTo = '';
    this.fetchPayments(1);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('egypt', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      completed: 'bg-green-500/20 text-green-500 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-500 border-red-500/30',
      refunded: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }

  getPatientName(payment: Payment): string {
    return payment.appointment?.patient?.user?.name ||
           payment.patient?.user?.name ||
           'Unknown Patient';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.last_page || 1)) {
      this.fetchPayments(page);
    }
  }

  setActiveTab(tab: 'overview' | 'history' | 'statistics'): void {
    this.activeTab = tab;
  }

  get lineChartViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  getLinePoints(): string {
    if (!this.revenueByMonth.length) {
      return '';
    }

    return this.revenueByMonth
      .map((month, index) => `${this.getPointX(index)},${this.getPointY(month.revenue)}`)
      .join(' ');
  }

  getAreaPath(): string {
    if (!this.revenueByMonth.length) {
      return '';
    }

    const firstPointX = this.getPointX(0);
    const lastPointX = this.getPointX(this.revenueByMonth.length - 1);
    const baseY = this.getBaselineY();

    const points = this.revenueByMonth
      .map((month, index) => `L ${this.getPointX(index)} ${this.getPointY(month.revenue)}`)
      .join(' ');

    return `M ${firstPointX} ${baseY} ${points} L ${lastPointX} ${baseY} Z`;
  }

  getPointX(index: number): number {
    const count = this.revenueByMonth.length;
    const availableWidth = this.chartWidth - (this.chartPaddingLeft + this.chartPaddingRight);

    if (count <= 1) {
      return this.chartPaddingLeft + availableWidth / 2;
    }

    return this.chartPaddingLeft + (index / (count - 1)) * availableWidth;
  }

  getPointY(revenue: number): number {
    const availableHeight = this.chartHeight - this.chartPaddingY * 2;
    if (this.maxRevenue <= 0) {
      return this.getBaselineY();
    }

    const ratio = revenue / this.maxRevenue;
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

  getGridLabel(index: number): string {
    if (this.chartGridLines.length <= 1 || this.maxRevenue <= 0) {
      return 'EGP 0.00';
    }

    const steps = this.chartGridLines.length - 1;
    const ratio = 1 - index / steps;
    const value = this.maxRevenue * ratio;
    return this.formatCurrency(value);
  }

  getBaselineY(): number {
    return this.chartHeight - this.chartPaddingY;
  }

  /**
   * Generate array of last 6 months in YYYY-MM format.
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
   * Format YYYY-MM keys to a readable month label.
   */
  private formatMonthLabel(monthKey: string): string {
    const parsed = new Date(`${monthKey}-01`);
    if (isNaN(parsed.getTime())) {
      return monthKey;
    }
    return parsed.toLocaleString('default', { month: 'short', year: 'numeric' });
  }
}
