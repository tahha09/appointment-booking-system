import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PatientService } from '../../../core/services/patient.service';
import { Notification } from '../../../core/services/notification';
import { Appointment as AppointmentService, AppointmentModel } from '../../../core/services/appointment';
import { Auth } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
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
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.scss'
})
export class MyAppointments implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  error: string | null = null;
  showRescheduleModal = false;
  rescheduleAppointment: AppointmentModel | null = null;
  rescheduleForm = {
    appointment_date: '',
    start_time: '',
    end_time: '',
    reason_for_reschedule: ''
  };
  rescheduleErrors = {
    appointment_date: '',
    start_time: '',
    end_time: ''
  };

  // Search and filter
  searchQuery: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  selectedDoctor: string = '';
  selectedStatus: string = 'all';
  doctors: string[] = [];

  // View details
  selectedAppointment: Appointment | null = null;
  showDetailsModal = false;

  // Rating
  showRatingModal = false;
  ratingAppointment: Appointment | null = null;
  rating = 0;
  ratingComment = '';
  existingRating: any = null;
  submittingRating = false;
  hoveredStar = 0;

  // Backend Pagination
  currentPage: number = 1;
  totalItems: number = 0;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;
  itemsPerPage: number = 8;

  private readonly apiBase = environment.apiUrl;

  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private cdr: ChangeDetectorRef,
    private auth: Auth,
    private notification: Notification,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.fetchAppointments(1);
  }

  fetchAppointments(page: number = 1): void {
    const params: any = { page, per_page: this.itemsPerPage };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    if (this.selectedStatus !== 'all') params.status = this.selectedStatus;

    this.loading = true;
    this.error = null;

    this.patientService.getAppointments(params, true).subscribe({
      next: (response: any) => {
        const responseData = response.data;
        // Handle paginated response structure
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          this.appointments = responseData.data;
          this.currentPage = responseData.current_page || 1;
          this.totalItems = responseData.total || 0;
          this.hasNextPage = responseData.current_page < responseData.last_page;
          this.hasPreviousPage = responseData.current_page > 1;
        } else if (Array.isArray(responseData)) {
          // Fallback for plain array
          this.appointments = responseData;
          this.totalItems = responseData.length;
        } else {
          this.appointments = [];
        }

        this.extractDoctors();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load appointments.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  extractDoctors(): void {
    const uniqueDoctors = new Set<string>();
    this.appointments.forEach(appointment => {
      if (appointment.doctor?.user?.name) {
        uniqueDoctors.add(appointment.doctor.user.name);
      }
    });
    this.doctors = Array.from(uniqueDoctors).sort();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.fetchAppointments(1);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchAppointments(1);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedDoctor = '';
    this.selectedStatus = 'all';
    this.currentPage = 1;
    this.fetchAppointments(1);
  }

  viewDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.showDetailsModal = true;
    // Load existing rating if appointment is completed
    if (appointment.status === 'completed') {
      this.loadExistingRating(appointment.id);
    }
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
    this.existingRating = null;
  }

  loadExistingRating(appointmentId: number): void {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http
      .get<{ success: boolean; data: any; message: string }>(
        `${this.apiBase}/patient/appointments/${appointmentId}/rating`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.existingRating = res.data;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          // No rating exists yet, which is fine
          this.existingRating = null;
          this.cdr.detectChanges();
        },
      });
  }

  openRatingModal(appointment: Appointment): void {
    this.ratingAppointment = appointment;
    this.rating = this.existingRating?.rating || 0;
    this.ratingComment = this.existingRating?.comment || '';
    this.showRatingModal = true;
  }

  closeRatingModal(): void {
    this.showRatingModal = false;
    this.ratingAppointment = null;
    this.rating = 0;
    this.ratingComment = '';
  }

  setRating(value: number): void {
    this.rating = value;
  }

  submitRating(): void {
    if (!this.ratingAppointment || this.rating === 0) {
      this.notification.error('Error', 'Please select a rating');
      return;
    }

    this.submittingRating = true;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    const payload: any = {
      appointment_id: this.ratingAppointment.id,
      rating: this.rating,
    };

    if (this.ratingComment.trim()) {
      payload.comment = this.ratingComment.trim();
    }

    const url = this.existingRating
      ? `${this.apiBase}/patient/ratings/${this.existingRating.id}`
      : `${this.apiBase}/patient/ratings`;

    const request = this.existingRating
      ? this.http.put<{ success: boolean; data: any; message: string }>(url, payload, { headers })
      : this.http.post<{ success: boolean; data: any; message: string }>(url, payload, { headers });

    request.subscribe({
      next: (res) => {
        this.notification.success('Success', 'Rating submitted successfully');
        this.closeRatingModal();
        if (this.selectedAppointment) {
          this.loadExistingRating(this.selectedAppointment.id);
        }
        this.submittingRating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error('Error', err?.error?.message || 'Failed to submit rating');
        this.submittingRating = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancelAppointment(id: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.notification.confirm(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      {
        confirmButtonText: 'Yes, Cancel',
        cancelButtonText: 'Keep Appointment'
      }
    ).then((result) => {
      if (result.isConfirmed) {
        const token = sessionStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`http://localhost:8000/api/patient/appointments/${id}/cancel`, {
          method: 'PUT',
          headers: headers
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              this.notification.success('Success', 'Appointment cancelled successfully!');
              this.fetchAppointments(this.currentPage);
              if (this.showDetailsModal) {
                this.closeDetailsModal();
              }
            } else {
              this.notification.error('Error', data.message || 'Failed to cancel appointment');
            }
          })
          .catch(err => {
            console.error('Error cancelling appointment:', err);
            this.notification.error('Error', 'Failed to cancel appointment. Please try again.');
          });
      }
    });
  }

  submitReschedule(): void {
  if (!this.rescheduleAppointment) return;



  // Step 1: Clean the data
  this.prepareRescheduleData();

  // Step 2: Validate the data
  if (!this.validateRescheduleForm()) {
    return;
  }

  // Step 3: Prepare data for submission
  const formattedData = this.formatRescheduleData();



  // Step 4: Get confirmation from the user
  this.confirmReschedule(formattedData);
}

private prepareRescheduleData(): void {
  // 1. Clean the time
  if (this.rescheduleForm.start_time) {
    // Ensure the time is HH:mm only
    this.rescheduleForm.start_time = this.rescheduleForm.start_time.substring(0, 5);

    // 2. Update end_time if necessary
    this.updateEndTimeBasedOnStartTime();
  }

  // 3. Clean the date
  this.rescheduleForm.appointment_date = this.formatDateForBackend(this.rescheduleForm.appointment_date);

  // 4. Calculate end_time if it doesn't exist
  if (!this.rescheduleForm.end_time && this.rescheduleForm.start_time) {
    this.rescheduleForm.end_time = this.calculateEndTime(this.rescheduleForm.start_time);
  }

  // 5. Clean end_time as well
  if (this.rescheduleForm.end_time) {
    this.rescheduleForm.end_time = this.rescheduleForm.end_time.substring(0, 5);
  }


}


private validateRescheduleForm(): boolean {
  // 1. Check required fields
  if (!this.rescheduleForm.appointment_date) {
    this.notification.error('Error', 'Please select a date');
    return false;
  }

  if (!this.rescheduleForm.start_time) {
    this.notification.error('Error', 'Please select a time');
    return false;
  }

  // 2. Check time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(this.rescheduleForm.start_time)) {
    this.notification.error('Error', 'Invalid time format. Please use HH:mm (e.g., 14:00)');
    return false;
  }

  // 3. Check that the date is not in the past
  const selectedDate = new Date(this.rescheduleForm.appointment_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Remove time to compare only the date

  if (selectedDate < today) {
    this.notification.error('Error', 'Cannot reschedule to a past date');
    return false;
  }

  // 4. Check that end_time is after start_time
  if (this.rescheduleForm.end_time) {
    const start = new Date(`1970-01-01T${this.rescheduleForm.start_time}`);
    const end = new Date(`1970-01-01T${this.rescheduleForm.end_time}`);

    if (end <= start) {
      this.notification.error('Error', 'End time must be after start time');
      return false;
    }
  }

  return true;
}

private formatRescheduleData() {
  return {
    appointment_date: this.rescheduleForm.appointment_date, // Selected appointment date
    start_time: this.rescheduleForm.start_time,             // Selected start time
    end_time: this.rescheduleForm.end_time,                 // Calculated or selected end time
    reason_for_reschedule: this.rescheduleForm.reason_for_reschedule.trim() || undefined // Optional reason
  };
}

private confirmReschedule(formattedData: any): void {
  // Show a confirmation dialog to the user before rescheduling
  this.notification.confirm(
    'Reschedule Appointment',
    `Are you sure you want to reschedule this appointment to ${this.formatDate(formattedData.appointment_date)} at ${this.formatTime(formattedData.start_time)}? The doctor will need to confirm the new time.`,
    {
      confirmButtonText: 'Yes, Reschedule',
      cancelButtonText: 'Cancel'
    }
  ).then((result) => {
    // If the user confirms, execute the rescheduling
    if (result.isConfirmed) {
      this.executeReschedule(formattedData);
    }
  });
}

private executeReschedule(formattedData: any): void {
  // Call the backend service to reschedule the appointment
  this.appointmentService.rescheduleAppointment(
    this.rescheduleAppointment!.id, // The ID of the appointment to reschedule
    formattedData                   // The formatted data for rescheduling
  ).subscribe({
    next: (response) => {
      // Handle successful rescheduling
      this.handleRescheduleSuccess(response);
    },
    error: (err) => {
      // Handle errors from the backend
      this.handleRescheduleError(err);
    }
  });
}

private handleRescheduleSuccess(response: any): void {
  this.closeRescheduleModal();
  if (response.success) {
    this.notification.success(
      'Success',
      `Appointment rescheduled successfully! Waiting for doctor confirmation.
      You have ${response.data.remaining_reschedules} reschedules remaining.`
    );

    // Update appointment data
    this.fetchAppointments(this.currentPage);


    if (this.showDetailsModal) {
      this.closeDetailsModal();
    }
  } else {
    this.notification.error('Error', response.message || 'Failed to reschedule appointment');
  }
}

private handleRescheduleError(err: any): void {
  console.error('Error rescheduling appointment:', err);
  console.error('Full error response:', err.error);

  // Clear previous errors
  this.rescheduleErrors = {
    appointment_date: '',
    start_time: '',
    end_time: ''
  };

  let errorMessage = 'Failed to reschedule appointment';

  if (err.error?.message) {
    errorMessage = err.error.message;
    console.error('Backend message:', err.error.message);

    // Check if it's a date-related error and set field-specific error
    if (errorMessage.includes('not available on the selected day') ||
        errorMessage.includes('unavailable on the selected date due to a scheduled holiday')) {
      this.rescheduleErrors.appointment_date = errorMessage;
    } else {
      // Show general error notification for other errors
      this.notification.error('Error', errorMessage);
    }
  } else if (err.error?.errors) {
    // Handle validation errors from Laravel
    const errors = err.error.errors;
    const errorMessages = [];

    for (const key in errors) {
      if (errors.hasOwnProperty(key)) {
        errorMessages.push(...errors[key]);
        // Set field-specific errors
        if (key === 'appointment_date') {
          this.rescheduleErrors.appointment_date = errors[key].join(', ');
        } else if (key === 'start_time') {
          this.rescheduleErrors.start_time = errors[key].join(', ');
        } else if (key === 'end_time') {
          this.rescheduleErrors.end_time = errors[key].join(', ');
        }
      }
    }

    errorMessage = errorMessages.join(', ');
    console.error('Validation errors:', errors);

    // If no field-specific errors were set, show general notification
    if (!this.rescheduleErrors.appointment_date && !this.rescheduleErrors.start_time && !this.rescheduleErrors.end_time) {
      this.notification.error('Error', errorMessage);
    }
  } else {
    this.notification.error('Error', errorMessage);
  }
}

  openRescheduleModal(appointment: any, event?: Event): void {
  if (event) {
    event.stopPropagation();
  }

  this.rescheduleAppointment = appointment as AppointmentModel;

  // Clean data before displaying it
  const cleanDate = this.formatDateForBackend(appointment.appointment_date);
  const cleanStartTime = appointment.start_time.substring(0, 5);

  // Calculate new end time based on start time
  const cleanEndTime = this.calculateEndTime(cleanStartTime);

  this.rescheduleForm = {
    appointment_date: cleanDate,
    start_time: cleanStartTime,
    end_time: cleanEndTime, // Use the calculated end_time
    reason_for_reschedule: ''
  };



  this.showRescheduleModal = true;
}

updateEndTimeBasedOnStartTime(): void {
  if (this.rescheduleForm.start_time && this.rescheduleAppointment) {
    // Calculate the new end_time based on the start_time
    this.rescheduleForm.end_time = this.calculateEndTime(this.rescheduleForm.start_time);
  }
}

// Modify calculateEndTime function to calculate correctly:
calculateEndTime(startTime: string): string {
  if (!startTime) return '';

  // Ensure correct format
  const time = startTime.substring(0, 5);
  const [hours, minutes] = time.split(':').map(Number);

  let newHours = hours;
  let newMinutes = minutes + 30; // Add 30 minutes as default duration

  if (newMinutes >= 60) {
    newHours += 1;
    newMinutes -= 60;
  }

  // Ensure hours do not exceed 23
  if (newHours >= 24) {
    newHours = 23;
    newMinutes = 59;
  }

  // Format the result
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

formatTimeForDisplay(time: string): string {
  return this.formatTime(time);
}

getDateFilter = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};


  formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.fetchAppointments(this.currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.fetchAppointments(this.currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getRecordAge(appointmentDate: string): string {
    const date = new Date(appointmentDate);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';

    if (diffTime > 0) {
      // Past date
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      }
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    } else {
      // Future date
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 30) return `in ${diffDays} days`;
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `in ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      const years = Math.floor(diffDays / 365);
      return `in ${years} ${years === 1 ? 'year' : 'years'}`;
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  canCancel(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }

  canReschedule(appointment: any): boolean {
  if (!appointment) return false;

  // 1. Make sure the status is "confirmed"
  if (appointment.status !== 'confirmed') return false;

  // 2. Check the number of reschedule attempts
  const rescheduleCount = appointment.reschedule_count || 0;
  if (rescheduleCount >= 3) return false;

  // 3. Ensure the appointment hasn't already passed
  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
  const now = new Date();

  if (appointmentDateTime < now) {
    return false; // The appointment has already passed
  }

  // 4. Ensure today is not the same day as the appointment
  const appointmentDate = new Date(appointment.appointment_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDate.getFullYear() === today.getFullYear() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getDate() === today.getDate()) {
    return false; // Same day
  }

  // 5. Ensure it is more than 4 hours before the appointment
  const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const minimumHoursBeforeAppointment = 4;

  if (hoursDifference < minimumHoursBeforeAppointment) {
    return false; // Less than 4 hours before the appointment
  }

  return true;
}

getRescheduleMessage(appointment: any): string {
  if (!appointment) return '';

  if (appointment.status !== 'confirmed') {
    return 'Only confirmed appointments can be rescheduled.';
  }

  const rescheduleCount = appointment.reschedule_count || 0;
  if (rescheduleCount >= 3) {
    return 'You have reached the maximum reschedule limit (3 times).';
  }

  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
  const now = new Date();

  if (appointmentDateTime < now) {
    return 'Cannot reschedule an appointment that has already passed.';
  }

  const appointmentDate = new Date(appointment.appointment_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDate.getFullYear() === today.getFullYear() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getDate() === today.getDate()) {
    return 'Cannot reschedule an appointment on the same day.';
  }

  const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const minimumHoursBeforeAppointment = 4;

  if (hoursDifference < minimumHoursBeforeAppointment) {
    return `Cannot reschedule an appointment less than ${minimumHoursBeforeAppointment} hours before the scheduled time.`;
  }

  return 'Click to reschedule this appointment.';
}


  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.dateFrom || this.dateTo || this.selectedDoctor || this.selectedStatus !== 'all');
  }

  getMinDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

formatTimeInput(): void {
  if (this.rescheduleForm.start_time) {
    // Ensure the time is in HH:mm format only (without seconds)
    this.rescheduleForm.start_time = this.rescheduleForm.start_time.substring(0, 5);

    // Update end_time when start_time changes
    this.updateEndTimeBasedOnStartTime();
  }

  if (this.rescheduleForm.end_time) {
    this.rescheduleForm.end_time = this.rescheduleForm.end_time.substring(0, 5);
  }
}

closeRescheduleModal(): void {
  this.showRescheduleModal = false;
  this.rescheduleAppointment = null;
  this.rescheduleForm = {
    appointment_date: '',
    start_time: '',
    end_time: '',
    reason_for_reschedule: ''
  };
  this.rescheduleErrors = {
    appointment_date: '',
    start_time: '',
    end_time: ''
  };

  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }
  }, 100);

}

// This function converts a date from ISO format to YYYY-MM-DD
formatDateForBackend(dateString: string): string {
  if (!dateString) return '';

  if (dateString.includes('T')) {
    // If the date is in ISO format (e.g., 2025-12-08T00:00:00.000000Z)
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateString; // If it's already in YYYY-MM-DD
}


  retryLoad(): void {
    this.fetchAppointments(this.currentPage);
  }
}
