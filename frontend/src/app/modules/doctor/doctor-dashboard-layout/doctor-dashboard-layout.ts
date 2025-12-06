import { Component, computed, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification-service';

@Component({
  selector: 'app-doctor-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-dashboard-layout.html',
  styleUrls: ['./doctor-dashboard-layout.scss'],
})
export class DoctorDashboardLayout implements OnInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly doctorName =  this.auth.getUserName() || 'Doctor';
  readonly today = new Date();

  notifications: any[] = [];
  showDropdown = false;
  unreadCount: number = 0;
  markingAllInProgress: boolean = false;
 
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
      console.log("NOTIFICATIONS FROM BACKEND:", res);
      this.notifications = res;
      this.unreadCount = this.notifications.filter(n => !n.read_at).length;
      this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    this.cdr.detectChanges();
  
  }

  markOneAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read_at) {
      notification.read_at = new Date();
      this.unreadCount--;
      this.cdr.detectChanges();
    }

      
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        console.log('Notification marked as read');
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
        
        if (notification) {
          notification.read_at = null;
          this.unreadCount++;
          this.cdr.detectChanges();
        }
      }
    });
  }

  markAll() {
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




  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
