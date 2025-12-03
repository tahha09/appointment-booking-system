import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-doctor-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-dashboard-layout.html',
  styleUrls: ['./doctor-dashboard-layout.scss'],
})
export class DoctorDashboardLayout {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly doctorName =  this.auth.getUserName() || 'Doctor';
  readonly today = new Date();

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
