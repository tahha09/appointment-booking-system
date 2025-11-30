import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  readonly doctorName =  this.auth.getUserName() || 'Doctor';
  readonly today = new Date();
}
