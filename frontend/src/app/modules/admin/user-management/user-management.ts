import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PaginatedResponse, User as AdminApiUser } from '../../../core/services/admin';
import { Auth } from '../../../core/services/auth';
import { ChangeDetectorRef } from '@angular/core';
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  profileImage?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {
  private adminService = inject(AdminService);
  private auth = inject(Auth);
  constructor(
    private cdn: ChangeDetectorRef
  ) {}

  // Fallback avatar image served from Laravel storage
  readonly defaultAvatarUrl = 'http://localhost:8000/storage/default-avatar.png';
  // All users loaded from backend
  users: AdminUser[] = [];

  // Users after applying search + filters
  filteredUsers: AdminUser[] = [];

  // Logged-in user id (used to hide self from list)
  currentUserId: number | null = null;
  // Logged-in user email (fallback for older sessions)
  currentUserEmail: string | null = null;

  // UI state
  isLoading = false;
  hasError = false;

  searchTerm = '';
  filters = {
    role: 'ALL' as 'ALL' | UserRole,
    status: 'ALL' as 'ALL' | UserStatus,
  };

  // User details modal state
  selectedUser: AdminUser | null = null;
  showUserModal = false;

  // Delete confirmation + result modal state
  userToDelete: AdminUser | null = null;
  showDeleteConfirmModal = false;
  showDeleteResultModal = false;
  deleteResultSuccess: boolean | null = null;
  deleteResultMessage = '';

  ngOnInit(): void {
    this.currentUserId = this.auth.getUserId();
    this.currentUserEmail = this.auth.getUserEmail();
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.hasError = false;

    this.adminService.getUsers().subscribe({
      next: (response: PaginatedResponse<AdminApiUser>) => {
        const apiUsers = response.data || [];

        // Map API users and exclude the currently logged-in user from the list
        this.users = apiUsers
          .filter((u) => {
            // Prefer filtering by id when available
            if (this.currentUserId) {
              return u.id !== this.currentUserId;
            }
            // Fallback: filter by email if id is not stored yet (older sessions)
            if (this.currentUserEmail) {
              return u.email !== this.currentUserEmail;
            }
            return true;
          })
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (u.role || '').toUpperCase() as UserRole,
            status: (u.status || 'ACTIVE').toUpperCase() as UserStatus,
            createdAt: u.created_at,
            // Prefer backend-provided URL, otherwise use local default avatar
            profileImage: u.profile_image_url || this.defaultAvatarUrl
          }));

        this.applyFilters();
        this.isLoading = false;
        this.cdn.detectChanges()
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.users = [];
        this.filteredUsers = [];
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFiltersChanged(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredUsers = this.users.filter((user) => {
      const matchesName =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesRole =
        this.filters.role === 'ALL' || user.role === this.filters.role;

      const matchesStatus =
        this.filters.status === 'ALL' ||
        user.status === this.filters.status;

      return matchesName && matchesRole && matchesStatus;
    });
  }

  approveDoctor(user: AdminUser): void {
    if (!(user.role === 'DOCTOR' && user.status === 'PENDING')) {
      return;
    }

    const id = Number(user.id);
    if (!id) {
      return;
    }

    this.adminService.approveDoctor(id).subscribe({
      next: () => {
        user.status = 'ACTIVE';
        this.applyFilters();
      },
      error: (error) => {
        console.error('Failed to approve doctor:', error);
      }
    });
  }

  toggleStatus(user: AdminUser): void {
    const id = Number(user.id);
    if (!id) {
      return;
    }

    const newStatus: UserStatus =
      user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const payload: Partial<AdminApiUser> = {
      status: newStatus.toLowerCase()
    };

    this.adminService.updateUser(id, payload).subscribe({
      next: (updated) => {
        // Reflect the actual status returned by the backend (source of truth)
        const savedStatus = ((updated as any).status || '').toUpperCase() as UserStatus;
        user.status = savedStatus || newStatus;
        // Reload users to ensure UI matches database
        this.loadUsers();
      },
      error: (error) => {
        console.error('Failed to update user status:', error);
      }
    });
  }

  // Open first modal: confirm delete
  openDeleteConfirm(user: AdminUser): void {
    this.userToDelete = user;
    this.showDeleteConfirmModal = true;
    this.deleteResultSuccess = null;
    this.deleteResultMessage = '';
  }

  // Close confirm modal without deleting
  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.userToDelete = null;
  }

  // Perform delete after confirmation
  confirmDelete(): void {
    if (!this.userToDelete) {
      return;
    }

    const user = this.userToDelete;
    const id = Number(user.id);
    if (!id) {
      return;
    }

    this.showDeleteConfirmModal = false;
    this.adminService.deleteUser(id).subscribe({
      next: () => {
        // Reload users from backend so list is always in sync
        this.loadUsers();
        this.deleteResultSuccess = true;
        this.deleteResultMessage = `User "${user.name}" has been deleted successfully.`;
        this.showDeleteResultModal = true;
        this.userToDelete = null;
        this.cdn.detectChanges();
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
        this.deleteResultSuccess = false;
        this.deleteResultMessage = `Failed to delete user "${user.name}". Please try again.`;
        this.showDeleteResultModal = true;
        this.cdn.detectChanges();
      }
    });
  }

  openUserModal(user: AdminUser): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  // Close result modal
  closeDeleteResultModal(): void {
    this.showDeleteResultModal = false;
    this.deleteResultSuccess = null;
    this.deleteResultMessage = '';
  }
}
