import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { finalize, timeout } from 'rxjs/operators';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { environment } from '../../../../environments/environment';

interface PaymentDoctorInfo {
  user?: {
    name?: string;
  } | null;
  specialization?: {
    name?: string;
  } | null;
}

interface PaymentAppointmentInfo {
  id: number;
  appointment_date: string;
  start_time: string;
  status: string;
  doctor?: PaymentDoctorInfo | null;
}

interface PaymentTransaction {
  id: number;
  appointment_id: number | null;
  amount: number | string;
  formatted_amount: string;
  currency: string;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  paid_at?: string | null;
  created_at: string;
  appointment?: PaymentAppointmentInfo | null;
}

interface PaymentSummary {
  total_transactions: number;
  total_paid: number;
  total_refunded: number;
  total_on_hold: number;
  last_transaction_at?: string | null;
}

interface PaymentsResponse {
  success: boolean;
  message?: string;
  data?: {
    transactions: PaymentTransaction[];
    summary?: PaymentSummary;
    pagination?: PaginationMeta;
  };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finance.html',
})
export class Finance implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly notification = inject(Notification);

  transactions: PaymentTransaction[] = [];
  summary: PaymentSummary = {
    total_transactions: 0,
    total_paid: 0,
    total_refunded: 0,
    total_on_hold: 0,
    last_transaction_at: null,
  };
  readonly perPage = 5;
  pagination: PaginationMeta = {
    current_page: 1,
    last_page: 1,
    per_page: this.perPage,
    total: 0,
  };
  loading = true;
  error = '';
  readonly apiBase = environment.apiUrl;

  ngOnInit(): void {
    this.loadTransactions();
  }

  get rangeStart(): number {
    if (!this.transactions.length) {
      return 0;
    }
    return (this.pagination.current_page - 1) * this.pagination.per_page + 1;
  }

  get rangeEnd(): number {
    if (!this.transactions.length) {
      return 0;
    }
    const potentialEnd = this.pagination.current_page * this.pagination.per_page;
    if (this.pagination.total) {
      return Math.min(potentialEnd, this.pagination.total);
    }
    return this.rangeStart + this.transactions.length - 1;
  }

  refresh(): void {
    this.loadTransactions(this.pagination.current_page);
  }

  goToPage(page: number): void {
    if (!Number.isFinite(page) || page === this.pagination.current_page) {
      return;
    }
    const targetPage = Math.max(1, Math.min(page, this.pagination.last_page));
    if (targetPage === this.pagination.current_page) {
      return;
    }
    this.loadTransactions(targetPage);
  }

  previousPage(): void {
    if (this.pagination.current_page > 1) {
      this.goToPage(this.pagination.current_page - 1);
    }
  }

  nextPage(): void {
    if (this.pagination.current_page < this.pagination.last_page) {
      this.goToPage(this.pagination.current_page + 1);
    }
  }

  trackByTransaction(_: number, tx: PaymentTransaction): number {
    return tx.id;
  }

  getDoctorName(tx: PaymentTransaction): string {
    return tx.appointment?.doctor?.user?.name || 'Assigned Doctor';
  }

  getSpecialization(tx: PaymentTransaction): string {
    return tx.appointment?.doctor?.specialization?.name || 'General Practice';
  }

  getFinancialStatusLabel(tx: PaymentTransaction): string {
    const status = tx.appointment?.status;
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
      case 'completed':
        return 'Paid';
      case 'cancelled':
        return 'Refunded';
      default:
        return this.mapPaymentStatus(tx.status);
    }
  }

  getFinancialStatusClass(tx: PaymentTransaction): string {
    const status = tx.appointment?.status;
    switch (status) {
      case 'pending':
        return 'inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700';
      case 'confirmed':
      case 'completed':
        return 'inline-flex items-center justify-center rounded-full border border-[#0c969c]/40 bg-[#0c969c]/10 px-3 py-1 text-xs font-semibold text-[#0a7075]';
      case 'cancelled':
        return 'inline-flex items-center justify-center rounded-full border border-[#274D60]/30 bg-[#274D60]/10 px-3 py-1 text-xs font-semibold text-[#274D60]';
      default:
        return 'inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600';
    }
  }

  private mapPaymentStatus(status: string): string {
    switch (status) {
      case 'completed':
        return 'Paid';
      case 'refunded':
        return 'Refunded';
      case 'failed':
        return 'Failed';
      case 'pending':
      case 'held':
        return 'Pending';
      default:
        return status;
    }
  }

  getMethodLabel(method: string): string {
    if (method === 'cash') {
      return 'Cash on Visit';
    }
    if (method === 'credit_card') {
      return 'Credit Card';
    }
    return method;
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return 'N/A';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private loadTransactions(page = this.pagination.current_page): void {
    this.loading = true;
    this.error = '';
    const headers = this.createAuthHeaders();
    if (!headers) {
      this.loading = false;
      this.error = 'Authentication required.';
      return;
    }

    const params = new HttpParams().set('page', String(page));

    this.http
      .get<PaymentsResponse>(`${this.apiBase}/patient/finance`, { headers, params })
      .pipe(
        timeout(10000),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const transactions = response.data?.transactions ?? [];
          this.transactions = transactions;
          this.summary = this.resolveSummary(response.data?.summary, transactions);
          this.applyPagination(response.data?.pagination, page, transactions.length);
        },
        error: (err) => {
          if (err?.name === 'TimeoutError') {
            this.error = 'The server is taking too long to respond. Please try again.';
          } else {
            this.error =
              err?.error?.message ||
              err?.message ||
              'Unable to load financial transactions.';
          }
          this.notification.error('Finance', this.error);
        },
    });
  }

  private applyPagination(
    pagination: PaginationMeta | undefined,
    fallbackPage: number,
    fallbackCount: number,
  ): void {
    if (pagination) {
      this.pagination = {
        current_page: pagination.current_page || fallbackPage,
        last_page: pagination.last_page || pagination.current_page || 1,
        per_page: pagination.per_page || this.perPage,
        total: pagination.total ?? fallbackCount,
      };
      return;
    }

    this.pagination = {
      current_page: fallbackPage,
      last_page: 1,
      per_page: this.perPage,
      total: fallbackCount,
    };
  }

  private resolveSummary(
    summary: PaymentSummary | undefined,
    transactions: PaymentTransaction[],
  ): PaymentSummary {
    const fallbackOnHold = this.calculateOnHoldTotal(transactions);

    if (!summary) {
      return this.calculateSummaryFromTransactions(transactions, fallbackOnHold);
    }

    return {
      total_transactions:
        summary.total_transactions ?? transactions.length,
      total_paid:
        summary.total_paid ??
        this.calculateSumByStatuses(transactions, ['completed']),
      total_refunded:
        summary.total_refunded ??
        this.calculateSumByStatuses(transactions, ['refunded']),
      total_on_hold:
        Math.max(
          summary.total_on_hold ?? 0,
          fallbackOnHold,
        ),
      last_transaction_at:
        summary.last_transaction_at ??
        this.getLatestTransactionDate(transactions),
    };
  }

  private calculateSummaryFromTransactions(
    transactions: PaymentTransaction[],
    fallbackOnHold?: number,
  ): PaymentSummary {
    const derivedOnHold =
      typeof fallbackOnHold === 'number'
        ? fallbackOnHold
        : this.calculateOnHoldTotal(transactions);

    return {
      total_transactions: transactions.length,
      total_paid: this.calculateSumByStatuses(transactions, ['completed']),
      total_refunded: this.calculateSumByStatuses(transactions, ['refunded']),
      total_on_hold: derivedOnHold,
      last_transaction_at: this.getLatestTransactionDate(transactions),
    };
  }

  private calculateSumByStatuses(
    transactions: PaymentTransaction[],
    statuses: string[],
  ): number {
    if (!transactions.length) {
      return 0;
    }

    const statusSet = new Set(statuses);
    return transactions.reduce((total, tx) => {
      if (!statusSet.has(tx.status)) {
        return total;
      }
      return total + this.parseAmount(tx.amount);
    }, 0);
  }

  private getLatestTransactionDate(
    transactions: PaymentTransaction[],
  ): string | null {
    if (!transactions.length) {
      return null;
    }

    return transactions.reduce<string | null>((latest, tx) => {
      const timestamp = tx.paid_at || tx.created_at;
      if (!timestamp) {
        return latest;
      }
      if (!latest) {
        return timestamp;
      }
      return new Date(timestamp).getTime() > new Date(latest).getTime()
        ? timestamp
        : latest;
    }, null);
  }

  private calculateOnHoldTotal(
    transactions: PaymentTransaction[],
  ): number {
    if (!transactions.length) {
      return 0;
    }

    const pendingStatuses = new Set(['pending', 'held']);
    return transactions.reduce((total, tx) => {
      const appointmentPending = tx.appointment?.status === 'pending';
      const paymentOnHold = pendingStatuses.has(tx.status);
      if (!appointmentPending && !paymentOnHold) {
        return total;
      }
      return total + this.parseAmount(tx.amount);
    }, 0);
  }

  private parseAmount(value: number | string | undefined | null): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    return 0;
  }

  private createAuthHeaders(): HttpHeaders | null {
    const token = this.auth.getToken();
    if (!token) {
      return null;
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
