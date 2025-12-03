import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';

interface ScheduleSlot {
  id: number;
  day_of_week: number | string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Holiday {
  id: number;
  holiday_date: string;
  reason: string | null;
}

interface ScheduleResponse {
  success?: boolean;
  message?: string;
  data?: {
    schedules?: ScheduleSlot[];
    holidays?: Holiday[];
    [key: string]: unknown;
  };
  schedules?: ScheduleSlot[];
  holidays?: Holiday[];
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule.html',
  styleUrls: ['./schedule.scss'],
})
export class Schedule implements OnInit {
  private readonly apiBase = 'http://localhost:8000/api/doctor';

  readonly daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  readonly minHolidayDate = new Date().toISOString().split('T')[0];

  schedules: ScheduleSlot[] = [];
  holidays: Holiday[] = [];
  loading = true;
  submitting = false;
  error = '';

  showScheduleModal = false;
  showHolidayModal = false;
  showDeleteConfirm = false;

  selectedSchedule: ScheduleSlot | null = null;
  selectedHoliday: Holiday | null = null;

  scheduleForm = {
    day_of_week: 0,
    start_time: '',
    end_time: '',
    is_available: true,
  };

  holidayForm = {
    holiday_date: '',
    reason: '',
  };

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly auth: Auth
  ) {}

  ngOnInit(): void {
    this.fetchScheduleData();
  }

  openScheduleModal(schedule?: ScheduleSlot): void {
    if (schedule) {
      this.selectedSchedule = schedule;
      this.populateScheduleForm(schedule);
    } else {
      this.selectedSchedule = null;
      this.resetScheduleForm();
    }

    this.showScheduleModal = true;
    this.showHolidayModal = false;
    this.showDeleteConfirm = false;
  }

  openHolidayModal(): void {
    this.selectedSchedule = null;
    this.selectedHoliday = null;
    this.resetHolidayForm();
    this.showHolidayModal = true;
    this.showScheduleModal = false;
    this.showDeleteConfirm = false;
  }

  closeModals(): void {
    this.showScheduleModal = false;
    this.showHolidayModal = false;
    this.showDeleteConfirm = false;
    this.selectedSchedule = null;
    this.selectedHoliday = null;
    this.submitting = false;
    this.resetScheduleForm();
    this.resetHolidayForm();
  }

  submitSchedule(): void {
    if (!this.scheduleForm.start_time || !this.scheduleForm.end_time) {
      return;
    }

    const dayOfWeek = Number(this.scheduleForm.day_of_week);
    if (Number.isNaN(dayOfWeek)) {
      return;
    }

    this.submitting = true;

    const payload = {
      day_of_week: dayOfWeek,
      start_time: this.normalizeTimePayload(this.scheduleForm.start_time),
      end_time: this.normalizeTimePayload(this.scheduleForm.end_time),
      is_available: !!this.scheduleForm.is_available,
    };

    const headers = this.createAuthHeaders();
    const options = headers ? { headers } : {};

    const scheduleId = this.selectedSchedule?.id;
    const request$ = scheduleId
      ? this.http.put(`${this.apiBase}/schedule/${scheduleId}`, payload, options)
      : this.http.post(`${this.apiBase}/schedule`, payload, options);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.closeModals();
        this.fetchScheduleData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to save schedule.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  submitHoliday(): void {
    if (!this.holidayForm.holiday_date || !this.holidayForm.reason.trim()) {
      return;
    }

    this.submitting = true;

    const payload = {
      holiday_date: this.holidayForm.holiday_date,
      reason: this.holidayForm.reason.trim(),
    };

    const headers = this.createAuthHeaders();
    const options = headers ? { headers } : {};

    this.http.post(`${this.apiBase}/holidays`, payload, options).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModals();
        this.fetchScheduleData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to add holiday.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  confirmDeleteSchedule(schedule: ScheduleSlot): void {
    this.selectedSchedule = schedule;
    this.selectedHoliday = null;
    this.showDeleteConfirm = true;
    this.showScheduleModal = false;
    this.showHolidayModal = false;
  }

  confirmDeleteHoliday(holiday: Holiday): void {
    this.selectedHoliday = holiday;
    this.selectedSchedule = null;
    this.showDeleteConfirm = true;
    this.showScheduleModal = false;
    this.showHolidayModal = false;
  }

  deleteSchedule(): void {
    if (!this.selectedSchedule) {
      return;
    }

    this.submitting = true;
    const headers = this.createAuthHeaders();
    const options = headers ? { headers } : {};

    this.http.delete(`${this.apiBase}/schedule/${this.selectedSchedule.id}`, options).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModals();
        this.fetchScheduleData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to delete schedule.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteHoliday(): void {
    if (!this.selectedHoliday) {
      return;
    }

    this.submitting = true;
    const headers = this.createAuthHeaders();
    const options = headers ? { headers } : {};

    this.http.delete(`${this.apiBase}/holidays/${this.selectedHoliday.id}`, options).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModals();
        this.fetchScheduleData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to delete holiday.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  getSchedulesForDay(day: number): ScheduleSlot[] {
    return this.schedules
      .filter((schedule) => this.normalizeDay(schedule.day_of_week) === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  formatTime(value: string): string {
    if (!value) {
      return 'N/A';
    }

    const normalized = value.length === 5 ? value : value.slice(0, 5);
    const date = new Date(`1970-01-01T${normalized}:00`);
    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  formatDate(value: string): string {
    if (!value) {
      return 'N/A';
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private fetchScheduleData(): void {
    this.loading = true;
    this.error = '';

    const headers = this.createAuthHeaders();
    const options = headers ? { headers } : {};

    this.http.get<ScheduleResponse>(`${this.apiBase}/schedule`, options).subscribe({
      next: (response) => {
        this.schedules = this.extractSchedules(response);
        this.holidays = this.extractHolidays(response);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to load schedule.';
        this.schedules = [];
        this.holidays = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private extractSchedules(response: ScheduleResponse | null | undefined): ScheduleSlot[] {
    if (!response) {
      return [];
    }
    if (response.data && Array.isArray(response.data.schedules)) {
      return response.data.schedules;
    }
    if (Array.isArray(response.schedules)) {
      return response.schedules;
    }
    return [];
  }

  private extractHolidays(response: ScheduleResponse | null | undefined): Holiday[] {
    if (!response) {
      return [];
    }
    if (response.data && Array.isArray(response.data.holidays)) {
      return response.data.holidays;
    }
    if (Array.isArray(response.holidays)) {
      return response.holidays;
    }
    return [];
  }

  private populateScheduleForm(schedule: ScheduleSlot): void {
    this.scheduleForm = {
      day_of_week: this.normalizeDay(schedule.day_of_week),
      start_time: this.toTimeInput(schedule.start_time),
      end_time: this.toTimeInput(schedule.end_time),
      is_available: schedule.is_available,
    };
  }

  private resetScheduleForm(): void {
    const defaultDay = this.daysOfWeek[0]?.value ?? 0;
    this.scheduleForm = {
      day_of_week: defaultDay,
      start_time: '',
      end_time: '',
      is_available: true,
    };
  }

  private resetHolidayForm(): void {
    this.holidayForm = {
      holiday_date: '',
      reason: '',
    };
  }

  private toTimeInput(value: string): string {
    if (!value) {
      return '';
    }
    const [hours, minutes] = value.split(':');
    if (hours === undefined || minutes === undefined) {
      return value;
    }
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  private normalizeDay(value: number | string): number {
    if (typeof value === 'number') {
      return value;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizeTimePayload(value: string): string {
    if (!value) {
      return value;
    }
    return value.length > 5 ? value.slice(0, 5) : value;
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
