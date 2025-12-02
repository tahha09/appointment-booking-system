import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, Footer],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class PatientProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly notification = inject(Notification);
  private readonly router = inject(Router);

  profileImage: string | null = null;
  private selectedImageDataUrl: string | null = null;
  isLoading = true;
  isSaving = false;
  showPasswordModal = false;
  isPasswordSaving = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  showDeleteModal = false;
  isDeletingAccount = false;
  showDeletePassword = false;

  form = this.fb.group({
    fullName: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.control(''),
    dateOfBirth: this.fb.control(''),
    address: this.fb.control(''),
    bloodType: this.fb.control(''),
  });

  bloodTypeOptions = [
    { value: '', label: 'Select blood type' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  passwordForm = this.fb.group({
    currentPassword: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    confirmNewPassword: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  deleteForm = this.fb.group({
    password: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.auth.getPatientProfile().subscribe({
      next: (profile) => {
        this.profileImage = profile.profileImage;

        this.form.patchValue({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth || '',
          address: profile.address,
          bloodType: profile.bloodType || '',
        });

        this.form.get('email')?.disable({ emitEvent: false });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;

        // Handle 401 Unauthorized - session expired
        if (error?.status === 401) {
          this.handleUnauthorized();
          return;
        }

        const message =
          error?.error?.error ||
          error?.error?.message ||
          'Failed to load profile.';

        this.notification.error('Profile load failed', message);
      },
    });
  }

  /**
   * Handle unauthorized access - redirect to login
   */
  private handleUnauthorized(): void {
    this.notification.error(
      'Session Expired',
      'Your session has expired. Please log in again.'
    );

    setTimeout(() => {
      this.auth.logout();
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/patient/profile' },
      });
    }, 1500);
  }

  get displayName(): string {
    return this.form.get('fullName')?.value || '';
  }

  getInitials(name: string): string {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter((part) => !!part);

    if (parts.length === 0) {
      return '';
    }

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    const firstInitial = parts[0][0];
    const lastInitial = parts[parts.length - 1][0];

    return (firstInitial + lastInitial).toUpperCase();
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.selectedImageDataUrl = result;
      this.profileImage = result;
      this.form.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.isSaving = true;

    this.auth
      .updatePatientProfile({
        fullName: raw.fullName || '',
        email: raw.email || '',
        phone: raw.phone || '',
        dateOfBirth: raw.dateOfBirth || '',
        address: raw.address || '',
        bloodType: raw.bloodType || null,
        profileImage: this.selectedImageDataUrl,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Profile updated', 'Your details have been saved.');
          this.form.markAsPristine();
        },
        error: (error) => {
          this.isSaving = false;
          
          if (error?.status === 401) {
            this.handleUnauthorized();
            return;
          }

          const message =
            error?.error?.error ||
            error?.error?.message ||
            'Failed to update profile. Please check your details and try again.';
          this.notification.error('Update failed', message);
        },
      });
  }

  openPasswordModal(): void {
    this.passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    if (this.isPasswordSaving) {
      return;
    }
    this.showPasswordModal = false;
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid || this.isPasswordSaving) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const pwd = this.passwordForm.getRawValue();

    if (pwd.newPassword !== pwd.confirmNewPassword) {
      this.notification.error(
        'Update failed',
        'New password and confirmation do not match.',
      );
      return;
    }

    const profile = this.form.getRawValue();

    this.isPasswordSaving = true;

    this.auth
      .updatePatientProfile({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        address: profile.address || '',
        bloodType: profile.bloodType || null,
        currentPassword: pwd.currentPassword || '',
        newPassword: pwd.newPassword || '',
        confirmNewPassword: pwd.confirmNewPassword || '',
        profileImage: this.selectedImageDataUrl,
      })
      .subscribe({
        next: () => {
          this.isPasswordSaving = false;
          this.showPasswordModal = false;
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          });
          this.notification.success('Password updated', 'Your password has been changed.');
        },
        error: (error) => {
          this.isPasswordSaving = false;
          
          if (error?.status === 401) {
            this.handleUnauthorized();
            return;
          }

          const message =
            error?.error?.error ||
            error?.error?.message ||
            'Failed to update password. Please check your details and try again.';
          this.notification.error('Update failed', message);
        },
      });
  }

  openDeleteModal(): void {
    this.deleteForm.reset({
      password: '',
    });
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.isDeletingAccount) {
      return;
    }
    this.showDeleteModal = false;
  }

  onDeleteAccountSubmit(): void {
    if (this.deleteForm.invalid || this.isDeletingAccount) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    const { password } = this.deleteForm.getRawValue();
    this.isDeletingAccount = true;

    this.auth.deleteAccount(password || '').subscribe({
      next: () => {
        this.isDeletingAccount = false;
        this.showDeleteModal = false;
        this.notification.success('Account deleted', 'Your account has been deleted.');
        this.router.navigateByUrl('/login');
      },
      error: (error) => {
        this.isDeletingAccount = false;
        
        if (error?.status === 401) {
          this.handleUnauthorized();
          return;
        }

        const message =
          error?.error?.error ||
          error?.error?.message ||
          'Failed to delete account. Please check your password and try again.';
        this.notification.error('Delete failed', message);
      },
    });
  }
}
