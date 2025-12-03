import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth'
import { Appointment } from '../../../core/services/appointment';
import { PatientService } from '../services/patient.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit { 
  constructor(
    private auth: Auth,
    private router: Router,
    private appointmentService: Appointment,
    private patientService: PatientService,
    private cdr: ChangeDetectorRef

  ){}
  

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
        console.log('Dashboard appointments data:', response);
        
        if (response.success && response.data) {
          const allAppointments = response.data.appointments || [];
          
          //  (confirmed + future date)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          this.upcomingAppointments = allAppointments.filter((appointment: any) => {
            const appointmentDate = new Date(appointment.appointment_date);
            return appointment.status === 'confirmed' && appointmentDate >= today;
          });
          
          
          this.totalAppointmentsCount = allAppointments.length;
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
        console.error('Error loading appointments:', err);
        this.error = 'Failed to load appointments data';
        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }

  loadMedicalHistoryData(): void {
  this.patientService.getMedicalHistory().subscribe({
    next: (response: any) => {
      console.log("Medical histories:", response);
      
      if (response.success && response.data) {
        this.totalMedicalHistoriesCount = response.data.length;

        // latest two
        this.recentMedicalHistories = response.data
          .sort((a: any, b: any) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
          .slice(0, 2);
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.cdr.detectChanges();
      console.error("Error loading medical histories:", err);
    }
  });
}

loadPrescriptionsData(): void {
  this.patientService.getPrescriptions().subscribe({
    next: (response: any) => {
      console.log("Prescriptions:", response);

      if (response.success && response.data) {
        const all = response.data;

        // total count
        this.totalPrescriptionsCount = all.length;

        // latest prescription
        this.latestPrescription = all
          .sort((a: any, b: any) => new Date(b.prescribed_date).getTime() - new Date(a.prescribed_date).getTime())
          [0]; // Take only the newest one
      }

      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error("Error loading prescriptions:", err);
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
}
