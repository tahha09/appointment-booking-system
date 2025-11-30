import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard { private auth = inject(Auth);
  private router = inject(Router);

  // Current date for welcome section
  currentDate = new Date();

  // Get user name from auth service
  get userName(): string {
    return this.auth.getUserName() || 'Patient';
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
}
