import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboard {
  private auth = inject(Auth);
  private router = inject(Router);

  // Get user name from auth service
  get userName(): string {
    return this.auth.getUserName() || 'Admin';
  }

  // Method to check if route is active
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  // Logout method
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
