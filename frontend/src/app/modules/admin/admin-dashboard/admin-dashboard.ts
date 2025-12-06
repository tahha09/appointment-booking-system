import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification-service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboard implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  notifications: any[] = [];
  showNotificationsDropdown = false;
  unreadCount: number = 0;
  markingAllInProgress: boolean = false;


  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  this.loadNotifications();
}

loadNotifications(): void {
  this.notificationService.getNotifications().subscribe({
    next: (res: any) => {
        this.notifications = res;
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
}

updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read_at).length;
  }

toggleNotificationsDropdown(): void {
  this.showNotificationsDropdown = !this.showNotificationsDropdown;
  this.cdr.detectChanges();
}

markOneAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read_at) {
      notification.read_at = new Date();
      this.updateUnreadCount();
      this.cdr.detectChanges();
    }
    
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => console.log('Notification marked as read'),
      error: (err) => {
        console.error(err);
        if (notification) {
          notification.read_at = null;
          this.updateUnreadCount();
          this.cdr.detectChanges();
        }
      }
    });
  }

markAll(): void {
    // 1. Collect all IDs of unread notifications
    const unreadNotifications = this.notifications.filter(n => !n.read_at);
    const unreadIds = unreadNotifications.map(n => n.id);
    
    if (unreadIds.length === 0) {
      return; // No unread notifications
    }
    
    // 2. Update locally first (for speed)
    this.notifications.forEach(notification => {
      if (!notification.read_at) {
        notification.read_at = new Date();
      }
    });
    this.unreadCount = 0;
    this.cdr.detectChanges();
    
    // 3. Mark each notification individually
    let completedCount = 0;
    let failedCount = 0;
    
    unreadIds.forEach(id => {
      this.notificationService.markAsRead(id).subscribe({
        next: () => {
          completedCount++;
          console.log(`Successfully marked notification ${completedCount}/${unreadIds.length} as read`);
          
          // When all are processed
          if (completedCount + failedCount === unreadIds.length) {
            console.log(`Marked ${completedCount} notifications as read`);
            if (failedCount > 0) {
              console.warn(`Failed to mark ${failedCount} notifications`);
            }
          }
        },
        error: (err) => {
          failedCount++;
          console.error(`Failed to mark notification ${id}:`, err);
          
          // When all are processed
          if (completedCount + failedCount === unreadIds.length) {
            console.log(`Processed all ${unreadIds.length} notifications`);
            if (failedCount > 0) {
              console.warn(`${failedCount} notifications failed to update on server`);
            }
          }
        }
      });
    });
  }


  // Get user name from auth service
  get userName(): string {
    return this.auth.getUserName() || 'Admin';
  }

  // Get today's date
  get today(): Date {
    return new Date();
  }

  // Method to check if route is active
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  // Toggle sidebar
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Toggle mobile menu
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Close mobile menu
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // Logout method
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
