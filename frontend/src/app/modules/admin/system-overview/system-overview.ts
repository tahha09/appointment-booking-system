import { AdminService } from './../../../core/services/admin';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardStats, User, Doctor, Appointment, SystemActivity, PaginatedResponse } from "./../../../core/services/admin";
import { of } from 'rxjs'; // Added missing import

@Component({
  selector: 'app-system-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './system-overview.html',
  styleUrls: ['./system-overview.scss']
})
export class SystemOverview implements OnInit {
  private adminService = inject(AdminService);
  private auth = inject(Auth);
  private notification = inject(Notification);

  // Statistics
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalDoctors: 0,
    totalPatients: 0,
    approvedDoctors: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    todaysAppointments: 0,
    newUsersToday: 0
  });

  // Data lists
  recentUsers = signal<User[]>([]);
  pendingDoctors = signal<Doctor[]>([]);
  recentAppointments = signal<Appointment[]>([]);
  recentActivities = signal<SystemActivity[]>([]);

  // Action loading states
  processingDoctor = signal<number | null>(null);

  // Loading states
  isLoading = signal({
    stats: false,
    users: false,
    doctors: false,
    appointments: false,
    activities: false
  });

  // Error states
  hasError = signal({
    stats: false,
    users: false,
    doctors: false,
    appointments: false,
    activities: false
  });

  // Quick stats - Updated to match your requested cards
  quickStats = signal([
    {
      label: 'Total Users',
      value: 0,
      icon: '👥',
      color: 'blue',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      loading: true,
      error: false
    },
    {
      label: 'Pending Approvals',
      value: 0,
      icon: '⏳',
      color: 'yellow',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      loading: true,
      error: false
    },
    {
      label: 'Upcoming Appointments',
      value: 0,
      icon: '📅',
      color: 'green',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
      loading: true,
      error: false
    },
    {
      label: 'Total Appointments',
      value: 0,
      icon: '📊',
      color: 'purple',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
      loading: true,
      error: false
    },
    {
      label: 'Total Doctors',
      value: 0,
      icon: '👨‍⚕️',
      color: 'indigo',
      borderColor: 'border-indigo-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      loading: true,
      error: false
    }
  ]);

  // Authentication check
  isAuthenticated = signal(false);

  ngOnInit(): void {
    // Check if user is authenticated and has admin role
    if (!this.auth.isAuthenticated() || !this.auth.isAdmin()) {
      console.warn('Unauthorized access to system overview. Redirecting...');
      // For now, just show empty data - in production you'd redirect
      this.isAuthenticated.set(false);
      return;
    }

    this.isAuthenticated.set(true);
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadDashboardStats();
    this.loadRecentUsers();
    this.loadPendingDoctors();
    this.loadRecentAppointments();
    this.loadRecentActivities();
  }

  loadDashboardStats(): void {
    this.isLoading.update(prev => ({ ...prev, stats: true }));
    this.hasError.update(prev => ({ ...prev, stats: false }));

    // Update quick stats loading state
    this.quickStats.update(stats => stats.map(stat => ({ ...stat, loading: true, error: false })));

    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);

        // Update quick stats with real data
        this.quickStats.update(prev => [
          {
            ...prev[0],
            value: stats.totalUsers,
            loading: false,
            error: false
          },
          {
            ...prev[1],
            value: stats.pendingApprovals,
            loading: false,
            error: false
          },
          {
            ...prev[2],
            value: stats.todaysAppointments,
            loading: false,
            error: false
          },
          {
            ...prev[3],
            value: stats.totalAppointments,
            loading: false,
            error: false
          },
          {
            ...prev[4],
            value: stats.totalDoctors,
            loading: false,
            error: false
          }
        ]);

        this.isLoading.update(prev => ({ ...prev, stats: false }));
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);

        // Mark quick stats as error
        this.quickStats.update(stats => stats.map(stat => ({
          ...stat,
          loading: false,
          error: true
        })));

        this.isLoading.update(prev => ({ ...prev, stats: false }));
        this.hasError.update(prev => ({ ...prev, stats: true }));
      }
    });
  }

  loadRecentUsers(): void {
    this.isLoading.update(prev => ({ ...prev, users: true }));
    this.hasError.update(prev => ({ ...prev, users: false }));

    this.adminService.getUsers().subscribe({
      next: (response: PaginatedResponse<User>) => {
        // Extract data array from paginated response
        const users = response.data;

        // Sort by creation date, get latest 3
        const sortedUsers = users.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 3);

        this.recentUsers.set(sortedUsers);
        this.isLoading.update(prev => ({ ...prev, users: false }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading.update(prev => ({ ...prev, users: false }));
        this.hasError.update(prev => ({ ...prev, users: true }));
      }
    });
  }

  loadPendingDoctors(): void {
    this.isLoading.update(prev => ({ ...prev, doctors: true }));
    this.hasError.update(prev => ({ ...prev, doctors: false }));

    this.adminService.getPendingDoctors().subscribe({
      next: (response: PaginatedResponse<Doctor>) => {
        // Extract data array from paginated response and map to Doctor interface
        const doctors = response.data.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.name || 'Unknown',
          email: doctor.email || '',
          specialty: doctor.specialty || 'Not specified',
          license_number: doctor.license_number || 'Not provided',
          status: 'pending' as const,
          created_at: doctor.created_at || new Date().toISOString()
        }));
        console.log('Pending doctors loaded:', doctors);
        this.pendingDoctors.set(doctors);
        this.isLoading.update(prev => ({ ...prev, doctors: false }));
      },
      error: (error) => {
        console.error('Error loading pending doctors:', error);
        this.isLoading.update(prev => ({ ...prev, doctors: false }));
        this.hasError.update(prev => ({ ...prev, doctors: true }));
      }
    });
  }

  loadRecentAppointments(): void {
    this.isLoading.update(prev => ({ ...prev, appointments: true }));
    this.hasError.update(prev => ({ ...prev, appointments: false }));

    this.adminService.getAppointments().subscribe({
      next: (response: PaginatedResponse<Appointment>) => {
        // Extract data array from paginated response
        const appointments = response.data;

        // Sort by date, get latest 3
        const sortedAppointments = appointments.sort((a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 3);

        this.recentAppointments.set(sortedAppointments);
        this.isLoading.update(prev => ({ ...prev, appointments: false }));
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading.update(prev => ({ ...prev, appointments: false }));
        this.hasError.update(prev => ({ ...prev, appointments: true }));
      }
    });
  }

  loadRecentActivities(): void {
    this.isLoading.update(prev => ({ ...prev, activities: true }));
    this.hasError.update(prev => ({ ...prev, activities: false }));

    this.adminService.getRecentActivity().subscribe({
      next: (activities) => {
        console.log('Recent activities loaded:', activities);
        // Get latest 3 activities
        const latestActivities = activities.slice(0, 3);
        this.recentActivities.set(latestActivities);
        this.isLoading.update(prev => ({ ...prev, activities: false }));
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.isLoading.update(prev => ({ ...prev, activities: false }));
        this.hasError.update(prev => ({ ...prev, activities: true }));
      }
    });
  }

  // Doctor approval actions - Fixed ID type
  approveDoctor(doctorId: number): void {
    this.notification.confirm(
      'Approve Doctor',
      'Are you sure you want to approve this doctor? They will be able to provide medical services to patients.',
      {
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel'
      }
    ).then((result) => {
      if (result.isConfirmed) {
        this.processingDoctor.set(doctorId);
        this.adminService.approveDoctor(doctorId).subscribe({
          next: () => {
            console.log('Doctor approved:', doctorId);
            // Remove from pending list
            const currentPending = this.pendingDoctors();
            const updatedPending = currentPending.filter(d => d.id !== doctorId);
            this.pendingDoctors.set(updatedPending);

            // Reload stats to get accurate counts
            this.loadDashboardStats();
            this.processingDoctor.set(null);

            // Show success message
            this.notification.success('Doctor Approved', 'The doctor has been successfully approved and can now provide services.');
          },
          error: (error) => {
            console.error('Error approving doctor:', error);
            this.notification.error('Approval Failed', 'Failed to approve doctor. Please try again.');
            this.processingDoctor.set(null);
          }
        });
      }
    });
  }

  rejectDoctor(doctorId: number): void {
    this.notification.confirm(
      'Reject Doctor Application',
      'Are you sure you want to reject this doctor application? This action cannot be undone and the doctor will need to reapply.',
      {
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel'
      }
    ).then((result) => {
      if (result.isConfirmed) {
        this.processingDoctor.set(doctorId);
        this.adminService.rejectDoctor(doctorId).subscribe({
          next: () => {
            console.log('Doctor rejected:', doctorId);
            // Remove from pending list
            const currentPending = this.pendingDoctors();
            const updatedPending = currentPending.filter(d => d.id !== doctorId);
            this.pendingDoctors.set(updatedPending);

            // Reload stats to get accurate counts
            this.loadDashboardStats();
            this.processingDoctor.set(null);

            // Show success message
            this.notification.success('Doctor Rejected', 'The doctor application has been rejected.');
          },
          error: (error) => {
            console.error('Error rejecting doctor:', error);
            this.notification.error('Rejection Failed', 'Failed to reject doctor application. Please try again.');
            this.processingDoctor.set(null);
          }
        });
      }
    });
  }

  // Update appointment status - Fixed ID type
  updateAppointmentStatus(appointmentId: number, status: string): void {
    this.adminService.updateAppointmentStatus(appointmentId, status).subscribe({
      next: (updatedAppointment) => {
        console.log('Appointment status updated:', appointmentId, status);
        // Update in recent appointments
        const currentAppointments = this.recentAppointments();
        const updatedAppointments = currentAppointments.map(app =>
          app.id === appointmentId ? { ...app, status: updatedAppointment.status } : app
        );
        this.recentAppointments.set(updatedAppointments);
      },
      error: (error) => {
        console.error('Error updating appointment:', error);
        this.notification.error('Update Failed', 'Failed to update appointment status. Please try again.');
      }
    });
  }

  // Format date
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  }

  // Format time
  formatTime(timeString: string): string {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.warn('Error formatting time:', timeString, error);
      return timeString;
    }
  }

  // Get status color
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Get status icon
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌',
      'scheduled': '📅',
      'completed': '✅',
      'cancelled': '❌',
      'active': '✅',
      'inactive': '⏸️'
    };
    return icons[status] || '❓';
  }

  // Get activity icon
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'doctor': '👨‍⚕️',
      'appointment': '📅',
      'user': '👤',
      'patient': '🩺',
      'payment': '💰',
      'system': '⚙️'
    };
    return icons[type] || '📝';
  }

  // Calculate percentage change
  calculatePercentageChange(current: number, previous: number): string {
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  }

  // Refresh all data
  refreshData(): void {
    this.loadAllData();
  }

  // Get loading state for quick stats
  isQuickStatsLoading(): boolean {
    return this.quickStats().some(stat => stat.loading);
  }

  // Get error state for quick stats
  hasQuickStatsError(): boolean {
    return this.quickStats().some(stat => stat.error);
  }
}
