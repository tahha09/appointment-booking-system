import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Appointment, AppointmentModel, AppointmentResponse } from '../../../core/services/appointment';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.scss',
})
export class AppointmentDetails  implements OnInit {
  appointment: AppointmentModel | null = null;
  loading: boolean = false;
  error: string = '';
  appointmentId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: Appointment,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('Route Parameters:', params);
      
      const idParam = params['id'];
      
      if (!idParam) {
        this.error = 'No appointment ID provided';
        return;
      }
      
      const id = Number(idParam);
      
      if (isNaN(id) || id <= 0) {
        this.error = 'Invalid appointment ID: ' + idParam;
        return;
      }
      
      this.appointmentId = id;
      console.log('Fetching appointment with ID:', this.appointmentId);
      this.fetchAppointmentDetails();
    });
  }

  fetchAppointmentDetails(): void {
    this.loading = true;
    this.error = '';

    this.appointmentService.getAppointmentById(this.appointmentId).subscribe({
      next: (res: AppointmentResponse) => {
        console.log('Appointment Details Response:', res.data);
        this.appointment = res.data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error Details:', err);
        this.error = err?.error?.message || 'Failed to load appointment details';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelAppointment(): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(this.appointmentId).subscribe({
        next: (res) => {
          alert(res.message);
          this.fetchAppointmentDetails();
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to cancel appointment');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/patient/my-appointments'], { relativeTo: this.route });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
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

    calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  } 

}
