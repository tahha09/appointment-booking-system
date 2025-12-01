import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {

  isSidebarCollapsed = false;

  isUserDropdownOpen = false;

  avatarLoadError = false;

  private auth = inject(Auth);

  constructor(public router: Router) {}


  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeUserDropdown() {
    this.isUserDropdownOpen = false;
  }

  // get user name
  get userName(): string {
    return this.auth.getUserName() || 'User Name';
  }

  // get user avatar
  get userAvatar(): string {
    return this.auth.getProfileImage() || 'assets/user-placeholder.png';
  }

  // get user initials for avatar fallback
  get userInitial(): string {
    const name = this.userName;
    const parts = name.trim().split(/\s+/).filter((part) => !!part);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  handleAvatarError() {
    this.avatarLoadError = true;
  }
  

  // logout
  logout() {
    this.auth.logout();
    this.closeUserDropdown();
    this.router.navigateByUrl('/login');
  }

  // go to profile 
  goToProfile() {
    this.closeUserDropdown();
    this.router.navigateByUrl('/patient/profile');
  }

  // go to home
  goToHome() {
    this.closeUserDropdown();
    this.router.navigateByUrl('/');
  }

}
