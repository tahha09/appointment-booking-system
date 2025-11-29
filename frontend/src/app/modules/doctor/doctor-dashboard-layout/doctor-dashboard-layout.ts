import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-dashboard-layout.html',
  styleUrls: ['./doctor-dashboard-layout.scss'],
})
export class DoctorDashboardLayout { }
