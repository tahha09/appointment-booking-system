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

  // get the first character of the name
   get userInitial(): string {
    const name = this.userName;
    return name.charAt(0).toUpperCase();
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
