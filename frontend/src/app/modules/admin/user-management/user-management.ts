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

  // Fallback avatar image served from frontend assets
  readonly defaultAvatarUrl = 'assets/default-avatar.png';
  // Users loaded from backend (already filtered and paginated)
  users: AdminUser[] = [];

  // UI state
  isLoading = false;
  hasError = false;

  // Pagination state
  pagination = {
    current_page: 1,
    last_page: 1,
    per_page: 6,
    total: 0,
    from: null as number | null,
    to: null as number | null
  };

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
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.isLoading = true;
    this.hasError = false;

    // Build query parameters
    const params: any = {
      page: page,
      per_page: this.pagination.per_page
    };

    // Add search parameter if provided
    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    // Add role filter if not 'ALL'
    if (this.filters.role !== 'ALL') {
      params.role = this.filters.role;
    }

    // Add status filter if not 'ALL'
    if (this.filters.status !== 'ALL') {
      params.status = this.filters.status;
    }

    this.adminService.getUsers(params).subscribe({
      next: (response: PaginatedResponse<AdminApiUser>) => {
        const apiUsers = response.data || [];

        // Map API users (backend already excludes logged-in user and applies filters)
        this.users = apiUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: (u.role || '').toUpperCase() as UserRole,
          status: (u.status || 'ACTIVE').toUpperCase() as UserStatus,
          createdAt: u.created_at,
          // Prefer backend-provided URL, otherwise use local default avatar
          profileImage: u.profile_image_url || this.defaultAvatarUrl
        }));

        // Update pagination info
        this.pagination = {
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || this.pagination.per_page,
          total: response.total || 0,
          from: response.from,
          to: response.to
        };

        this.isLoading = false;
        this.cdn.detectChanges()
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.users = [];
        this.isLoading = false;
        this.hasError = true;
        this.cdn.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    // Reset to page 1 when search changes
    this.pagination.current_page = 1;
    this.loadUsers(1);
  }

  onFiltersChanged(): void {
    // Reset to page 1 when filters change
    this.pagination.current_page = 1;
    this.loadUsers(1);
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
        // Reload current page to reflect changes
        this.loadUsers(this.pagination.current_page);
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
        // Reload current page to ensure UI matches database
        this.loadUsers(this.pagination.current_page);
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

  // Pagination methods
  goToPreviousPage(): void {
    if (this.pagination.current_page > 1) {
      this.loadUsers(this.pagination.current_page - 1);
    }
  }

  goToNextPage(): void {
    if (this.pagination.current_page < this.pagination.last_page) {
      this.loadUsers(this.pagination.current_page + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.loadUsers(page);
    }
  }

  // Helper method to get page numbers for pagination display
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const currentPage = this.pagination.current_page;
    const lastPage = this.pagination.last_page;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(lastPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Helper to check if previous page exists
  hasPreviousPage(): boolean {
    return this.pagination.current_page > 1;
  }

  // Helper to check if next page exists
  hasNextPage(): boolean {
    return this.pagination.current_page < this.pagination.last_page;
  }
}

