import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth'
import { Appointment } from '../../../core/services/appointment';
import { PatientService } from '../../../core/services/patient.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  // Scroll to top properties
  showScrollTop = false;
  scrollProgress = 0;

  constructor(
    private auth: Auth,
    private router: Router,
    private appointmentService: Appointment,
    private patientService: PatientService,
    private cdr: ChangeDetectorRef

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
          // Handle paginated response: check for .data, .appointments, or use directly if array
          let allAppointments = [];
          if (Array.isArray(response.data)) {
            allAppointments = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            allAppointments = response.data.data;
          } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
            allAppointments = response.data.appointments;
          }

          //  (confirmed + future date)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          this.upcomingAppointments = allAppointments.filter((appointment: any) => {
            const appointmentDate = new Date(appointment.appointment_date);
            return (appointment.status === 'confirmed' || appointment.status === 'pending') && appointmentDate >= today;
          });

          this.totalAppointmentsCount = response.data.total || allAppointments.length;
          this.upcomingAppointmentsCount = this.upcomingAppointments.length;


          this.upcomingAppointments = this.upcomingAppointments
            .sort((a: any, b: any) =>
              new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
            )
            .slice(0, 2); // take first 2 appointments
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
    // Navigate to booking page
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

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = doc.scrollHeight - doc.clientHeight;
    this.showScrollTop = height > 0 && scrollTop > 80;
    this.scrollProgress = height > 0 ? Math.min(100, Math.round((scrollTop / height) * 100)) : 0;
  }

  scrollToTop(): void {
    const doc = document.documentElement;
    const start = window.scrollY || doc.scrollTop || 0;
    const duration = 600;
    const startTime = performance.now();

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const scroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      const nextScroll = start * (1 - eased);

      window.scrollTo(0, nextScroll);

      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  }
}
