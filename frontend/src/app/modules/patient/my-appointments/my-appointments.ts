import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Appointment, AppointmentModel, AppointmentResponse, AppointmentsListResponse } from '../../../core/services/appointment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.scss',
})
export class MyAppointments implements OnInit {

  appointments: AppointmentModel[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private appointmentService: Appointment, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void { 
    this.fetchAppointments();
  }

  fetchAppointments(): void {
    this.loading = true;
    this.error = '';

    this.appointmentService.getAppointments().subscribe({
      next: (res: AppointmentsListResponse) => {
        /* console.log('API Response:', res); 
        console.log('Appointments:', res.data.appointments);  */
        this.appointments = res.data.appointments;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = err?.error?.message || 'Failed to load appointments';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelAppointment(id: number): void {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: (res) => {
        alert(res.message);
        this.fetchAppointments(); 
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to cancel appointment');
      }
    });
  }
}

viewDetails(id: number): void {
  this.router.navigate(['/patient/appointment-details', id]);
  // console.log('Viewing details for appointment:', id);
}




}
