import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification-service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit {

  isSidebarCollapsed = false;

  isUserDropdownOpen = false;

  avatarLoadError = false;

  private auth = inject(Auth);
  private readonly notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  constructor(public router: Router) {}

  // notifications
  notifications: any[] = [];
  showNotifications = false;
  unreadCount = 0;

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        console.log("PATIENT NOTIFICATIONS:", res);
        this.notifications = res;
        this.unreadCount = this.notifications.filter(n => !n.read_at).length;
        this.cdr.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.cdr.detectChanges();
  }

  markOneAsRead(notificationId: string) {
    const n = this.notifications.find(x => x.id === notificationId);
    if (n && !n.read_at) {
      n.read_at = new Date();
      this.unreadCount--;
      this.cdr.detectChanges();
    }

    this.notificationService.markAsRead(notificationId).subscribe({
      error: () => {
        if (n) {
          n.read_at = null;
          this.unreadCount++;
          this.cdr.detectChanges();
        }
      }
    });
  }

  markAllAsRead() {
    const unread = this.notifications.filter(n => !n.read_at);
    const ids = unread.map(n => n.id);

    if (ids.length === 0) return;

    this.notifications.forEach(n => {
      if (!n.read_at) n.read_at = new Date();
    });

    this.unreadCount = 0;
    this.cdr.detectChanges();

    ids.forEach(id => {
      this.notificationService.markAsRead(id).subscribe();
    });
  }



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
    return this.auth.getProfileImage() || 'assets/default-avatar.png';
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
