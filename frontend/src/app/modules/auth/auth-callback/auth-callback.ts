import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Api } from '../../../core/services/api';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-callback.html',
})
export class AuthCallback implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(Api);
  private readonly notification = inject(Notification);

  isLoading = true;
  showRoleSelection = false;
  error = '';
  isSubmittingRole = false;
  roleError = '';
  specializations: any[] = [];

  roleForm = this.fb.group({
    role: ['patient', [Validators.required]],
    specializationId: [''],
  });

  ngOnInit(): void {
    this.handleAuthCallback();
  }

  private handleAuthCallback(): void {
    // Check for token in URL params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const newUser = params['new_user'] === 'true';
      const userData = params['user'];
      const error = params['error'];

      if (error) {
        this.isLoading = false;
        this.error = 'Authentication failed. Please try again.';
        return;
      }

      if (token) {
        // Store the token in auth service
        this.auth.setToken(token);

        // If user data is provided, set up the user session
        if (userData) {
          try {
            const user = JSON.parse(decodeURIComponent(userData));

            // Store user data in sessionStorage (matching auth service expectations)
            sessionStorage.setItem('user_id', String(user.id));
            sessionStorage.setItem('user_role', user.role);
            sessionStorage.setItem('user_name', user.name);
            sessionStorage.setItem('user_email', user.email);
            if (user.profile_image) {
              sessionStorage.setItem('profile_image', user.profile_image);
            }

            // Update auth service with the user data
            this.auth.setRole(user.role);
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }

        if (newUser) {
          // New user - show role selection
          this.isLoading = false;
          this.showRoleSelection = true;
          this.loadSpecializations();
        } else {
          // Existing user - redirect to dashboard
          this.redirectToDashboard();
        }
      } else {
        this.isLoading = false;
        this.error = 'Authentication token not found.';
      }
    });
  }

  private loadSpecializations(): void {
    this.api.get('/specializations/filter-list').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.specializations = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load specializations:', error);
      },
    });
  }

  submitRoleSelection(): void {
    if (this.roleForm.invalid || this.isSubmittingRole) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const { role, specializationId } = this.roleForm.value;
    const specializationIdValue = specializationId || undefined;
    if (!role) {
      this.roleForm.markAllAsTouched();
      return;
    }

    // Check if specialization is required for doctors
    if (role === 'doctor' && !specializationIdValue) {
      this.roleForm.get('specializationId')?.setErrors({ required: true });
      this.roleForm.markAllAsTouched();
      return;
    }

    this.isSubmittingRole = true;
    this.roleError = '';

    this.api.post('/auth/google/update-role', {
      role,
      specializationId: role === 'doctor' ? specializationIdValue : undefined,
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update session storage with the new role
          const updatedUser = response.data.user;
          sessionStorage.setItem('user_role', updatedUser.role);
          sessionStorage.setItem('user_id', String(updatedUser.id));
          sessionStorage.setItem('user_name', updatedUser.name);
          sessionStorage.setItem('user_email', updatedUser.email);
          if (updatedUser.profile_image) {
            sessionStorage.setItem('profile_image', updatedUser.profile_image);
          }

          // Update auth service with new role
          this.auth.setRole(updatedUser.role);

          this.notification.success('Registration completed', 'Welcome to our platform! Redirecting to home page...', {
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          }).then(() => {
            // Redirect based on the new role
            this.router.navigateByUrl('/');
          });
        } else {
          this.roleError = response.message || 'Failed to update role.';
        }
        this.isSubmittingRole = false;
      },
      error: (error) => {
        this.isSubmittingRole = false;
        this.roleError = error?.error?.error || 'Failed to update role. Please try again.';
        this.notification.error('Registration failed', this.roleError);
      },
    });
  }

  private redirectToDashboard(): void {
    // Get user role from sessionStorage directly (more reliable for OAuth callback)
    const role = sessionStorage.getItem('user_role') || this.auth.getRole() || this.auth.getUserRole();

    if (role === 'patient') {
      this.router.navigateByUrl('/patient');
    } else if (role === 'doctor') {
      this.router.navigateByUrl('/doctor');
    } else if (role === 'admin') {
      this.router.navigateByUrl('/admin');
    } else {
      this.router.navigateByUrl('/');
    }
  }

  retryAuth(): void {
    window.location.href = 'http://localhost:8000/api/auth/google';
  }
}
