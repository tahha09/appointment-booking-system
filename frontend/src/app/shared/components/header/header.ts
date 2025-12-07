import { Component, signal, inject, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, AfterViewInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly menuOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  protected isPatient(): boolean {
    return this.auth.isPatient();
  }

  protected isDoctor(): boolean {
    return this.auth.isDoctor();
  }

  protected isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  protected get avatarUrl(): string | null {
    return this.auth.getProfileImage();
  }

  protected get userInitial(): string {
    return (this.auth.getUserName() || 'U').charAt(0).toUpperCase();
  }

  protected logout(): void {
    this.auth.logout();
    this.userMenuOpen.set(false);
    this.router.navigateByUrl('/');
  }

  protected goToDashboard(): void {
    this.userMenuOpen.set(false);

    const userRole = this.auth.getUserRole();

    const dashboardRoutes: { [key: string]: string } = {
      'patient': '/patient',
      'doctor': '/doctor',
      'admin': '/admin'
    };

    const route = dashboardRoutes[userRole];

    if (route) {
      this.router.navigateByUrl(route);
    } else {
      console.warn('Unknown user role or no dashboard defined for role:', userRole);
      this.router.navigateByUrl('/');
    }
  }

  protected goToProfile(): void {
    this.userMenuOpen.set(false);

    const userRole = this.auth.getUserRole();

    const profileRoutes: { [key: string]: string } = {
      'patient': '/patient/profile',
      'doctor': '/doctor/profile',
      'admin': '/admin/profile'
    };

    const route = profileRoutes[userRole];

    if (route) {
      this.router.navigateByUrl(route);
    } else {
      this.router.navigateByUrl('/patient/profile'); // Default fallback
    }
  }

  ngOnInit(): void {
    // Load user profile to ensure avatar data is available
    if (this.isLoggedIn()) {
      this.auth.getUserProfile().subscribe({
        next: (profile) => {
          // Profile data is automatically updated in the auth service
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to load user profile in header:', err)
      });
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
}
