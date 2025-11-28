import { Component, signal, inject } from '@angular/core';
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
export class Header {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

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

  protected get avatarUrl(): string {
    return this.auth.getProfileImage() || 'assets/user-placeholder.png';
  }

  protected logout(): void {
    this.auth.logout();
    this.userMenuOpen.set(false);
    this.router.navigateByUrl('/login');
  }

  protected goToDashboard(): void {
    this.userMenuOpen.set(false);
    this.router.navigateByUrl('/patient/dashboard');
  }

  protected goToProfile(): void {
    this.userMenuOpen.set(false);
    this.router.navigateByUrl('/patient/profile');
  }
}
