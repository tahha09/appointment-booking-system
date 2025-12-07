import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth'
import { Appointment } from '../../../core/services/appointment';
import { PatientService } from '../../../core/services/patient.service'
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  /* Scroll logic removed */

  constructor(
    private auth: Auth,
    private router: Router,
    private appointmentService: Appointment,
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
    private bookingService: BookingService

  ) { }


  // Current date for welcome section
  currentDate = new Date();

  upcomingAppointmentsCount: number = 0;
  totalAppointmentsCount: number = 0;
  totalMedicalHistoriesCount: number = 0;
  upcomingAppointments: any[] = [];
  recentMedicalHistories: any[] = [];
  totalPrescriptionsCount: number = 0;
  latestPrescription: any = null;
  loading: boolean = true;
  error: string | null = null;

  // Get user name from auth service
  get userName(): string {
    return this.auth.getUserName() || 'Patient';
  }

  // Data properties
  allAppointments: any[] = [];
  filteredAppointments: any[] = [];
  // No longer using currentFilter property as we display only a simplified view

  ngOnInit(): void {
    this.loadAppointmentsData();
    this.loadMedicalHistoryData();
    this.loadPrescriptionsData();
  }

  loadAppointmentsData(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.appointmentService.getAppointments().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Handle paginated response
          let rawData = [];
          if (Array.isArray(response.data)) {
            rawData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            rawData = response.data.data;
          } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
            rawData = response.data.appointments;
          }

          this.allAppointments = rawData;
          this.totalAppointmentsCount = response.data.total || rawData.length;

          // Calculate upcoming count separately for the stats card
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          this.upcomingAppointmentsCount = this.allAppointments.filter((app: any) => {
            const appDate = new Date(app.appointment_date);
            return app.status === 'confirmed' && appDate >= today;
          }).length;

          // Default display: Upcoming Appointments logic (Confirmed/Pending & Future)
          // Sort by date ascending (soonest first)
          this.filteredAppointments = this.allAppointments
            .filter((app: any) => {
              const appDate = new Date(app.appointment_date);
              return app.status === 'confirmed' && appDate >= today;
            })
            .sort((a: any, b: any) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
            .slice(0, 5);

          this.upcomingAppointments = this.filteredAppointments;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Failed to load appointments data';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelAppointment(id: number) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    // Optimistic update
    const previousAppointments = [...this.allAppointments];
    const appIndex = this.allAppointments.findIndex(a => a.id === id);
    if (appIndex > -1) {
      this.allAppointments[appIndex] = { ...this.allAppointments[appIndex], status: 'cancelled' };
      // Re-filter to remove the cancelled appointment from the list if it's no longer 'upcoming'
      // Or just reload data. Since logic is simple, we can just reload for correctness.
      this.loadAppointmentsData();
      this.cdr.detectChanges();
    }

    this.appointmentService.cancelAppointment(id).subscribe({
      next: (response: any) => {
        this.loadAppointmentsData(); // Reload to ensure sync
      },
      error: (err: any) => {
        // Revert on error
        this.allAppointments = previousAppointments;
        this.loadAppointmentsData();
        this.cdr.detectChanges();
        alert('Failed to cancel appointment');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'text-teal-600 bg-teal-50 border-teal-100';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  }

  loadMedicalHistoryData(): void {
    this.patientService.getMedicalHistory().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Handle paginated response
          const historyData = Array.isArray(response.data) ? response.data :
            (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);

          this.totalMedicalHistoriesCount = response.data.total || historyData.length;

          // latest two
          this.recentMedicalHistories = [...historyData]
            .sort((a: any, b: any) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
            .slice(0, 2);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cdr.detectChanges();
      }
    });
  }

  loadPrescriptionsData(): void {
    this.patientService.getPrescriptions().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Handle paginated response
          const all = Array.isArray(response.data) ? response.data :
            (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);

          // total count
          this.totalPrescriptionsCount = response.data.total || all.length;

          // latest prescription
          if (all.length > 0) {
            this.latestPrescription = [...all]
              .sort((a: any, b: any) => new Date(b.prescribed_date).getTime() - new Date(a.prescribed_date).getTime())
            [0]; // Take only the newest one
          } else {
            this.latestPrescription = null;
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cdr.detectChanges();
      }
    });
  }

  /* viewMedicalHistory(historyId: number): void {
    this.router.navigate(['/patient/medical-history', historyId]);
    // console.log('Viewing medical history:', historyId);
  } */

  viewDetails(id: number): void {
    this.router.navigate(['/patient/appointment-details', id]);

  }

  goToMyAppointments(): void {
    this.router.navigate(['/patient/my-appointments']);
  }

  // Navigation methods
  viewMedicalRecords() {
    this.router.navigate(['/patient/medical-history']);
  }

  viewPrescriptions() {
    this.router.navigate(['/patient/prescriptions']);
  }

  bookAppointment() {
    this.bookingService.startBooking({ extras: { source: 'patient-dashboard' } });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    return timeString.substring(0, 5);
  }

  getTimeFromDate(dateString: string, timeString: string): string {
    const date = new Date(dateString);
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getDoctorName(appointment: any): string {
    return appointment.doctor?.user?.name ||
      appointment.doctor?.name ||
      'Unknown Doctor';
  }

  getSpecialization(appointment: any): string {
    return appointment.doctor?.specialization?.name ||
      appointment.doctor?.specialization ||
      'General';
  }

  isUpcomingAppointment(appointment: any): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const appDate = new Date(appointment.appointment_date);
  return appointment.status === 'confirmed' && appDate >= today;
}

  /* Scroll logic removed */

  trackById(index: number, item: any): any {
    return item.id;
  }
}