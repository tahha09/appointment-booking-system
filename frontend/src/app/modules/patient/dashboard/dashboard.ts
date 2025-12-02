import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  // Current date for welcome section
  currentDate = new Date();
  
  // User profile image
  userImage: string | null = null;
  isLoadingProfile = true;

  ngOnInit(): void {
    // Load user profile image
    this.userImage = this.auth.getProfileImage();
    this.isLoadingProfile = false;
  }

  // Get user name from auth service
  get userName(): string {
    return this.auth.getUserName() || 'Patient';
  }

  // Get user initials for avatar fallback
  get userInitials(): string {
    const name = this.userName;
    const parts = name.trim().split(/\s+/).filter(p => !!p);
    if (parts.length === 0) return 'P';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
