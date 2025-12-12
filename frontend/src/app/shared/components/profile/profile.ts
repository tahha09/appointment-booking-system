import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

type UserRole = 'patient' | 'doctor' | 'admin' | 'staff';

// Custom validators
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Optional field
    }
    const phoneRegex = /^01\d{9}$/;
    return phoneRegex.test(control.value) ? null : { invalidPhone: true };
  };
}

export function dateOfBirthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Optional field
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());

    if (selectedDate > today) {
      return { futureDate: true };
    }
    if (selectedDate > minAgeDate) {
      return { underage: true };
    }
    return null;
  };
}

// Renamed from UserProfile to UserProfileData to avoid conflict
interface UserProfileData {
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  role: UserRole;
  profileImage?: string;
  address?: string;

  // Patient specific
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;

  // Doctor specific
  specialty?: string;
  licenseNumber?: string;
  qualifications?: string;
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
  availability?: string;
  department?: string;

  // Admin specific
  permissions?: any[];
  adminLevel?: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TitleCasePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class UserProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly notification = inject(Notification);
  private readonly router = inject(Router);
  private originalData: any;

  profileImage: string | null = null;
  private selectedImageDataUrl: string | null = null;
  isLoading = true;
  isSaving = false;
  avatarLoadError = false;
  showPasswordModal = false;
  isPasswordSaving = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  showDeleteModal = false;
  isDeletingAccount = false;
  showDeletePassword = false;

  userRole: UserRole = 'patient';

  // Main form for common fields
  form = this.fb.group({
    fullName: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.control('', {
      validators: [phoneValidator()],
    }),
    dateOfBirth: this.fb.control('', {
      validators: [dateOfBirthValidator()],
    }),
    address: this.fb.control(''),
  });

  // Role-specific forms
  patientForm = this.fb.group({
    medicalHistory: this.fb.control(''),
    allergies: this.fb.control(''),
    emergencyContact: this.fb.control(''),
    insuranceProvider: this.fb.control(''),
    insurancePolicyNumber: this.fb.control(''),
    bloodType: this.fb.control(''),
  });

  doctorForm = this.fb.group({
    specialty: this.fb.control({value: '', disabled: true}),
    licenseNumber: this.fb.control(''),
    qualifications: this.fb.control(''),
    experienceYears: this.fb.control<number | null>(null),
    bio: this.fb.control(''),
    consultationFee: this.fb.control<number | null>(null),
    availability: this.fb.control(''),
    department: this.fb.control(''),
  });

  adminForm = this.fb.group({
    department: this.fb.control(''),
    permissions: this.fb.control<any[]>([]),
    adminLevel: this.fb.control(''),
  });

  passwordForm = this.fb.group({
    currentPassword: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    newPassword: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    confirmNewPassword: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
  });

  deleteForm = this.fb.group({
    password: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
  });

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.isLoading = true;
    this.auth.getUserProfile().subscribe({
      next: (profile: UserProfileData) => {
        this.profileImage = profile.profileImage || null;
        this.avatarLoadError = false;
        this.userRole = profile.role as UserRole;

        // Patch common fields
        this.form.patchValue({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          address: profile.address || '',
        });

        // Patch role-specific fields
        this.patchRoleSpecificFields(profile);

        // Disable email field (should not be editable)
        this.form.get('email')?.disable({ emitEvent: false });

        // Mark role-specific forms as pristine
        this.patientForm.markAsPristine();
        this.doctorForm.markAsPristine();
        this.adminForm.markAsPristine();

        this.isLoading = false;
      },
      error: (error: any) => {
        this.handleProfileLoadError(error);
      },
    });
  }

  private patchRoleSpecificFields(profile: UserProfileData): void {
    switch (this.userRole) {
      case 'patient':
        this.patientForm.patchValue({
          medicalHistory: profile.medicalHistory || '',
          allergies: profile.allergies || '',
          emergencyContact: profile.emergencyContact || '',
          insuranceProvider: profile.insuranceProvider || '',
          insurancePolicyNumber: profile.insurancePolicyNumber || '',
          bloodType: profile.bloodType || '',
        });
        break;
      case 'doctor':
        this.doctorForm.patchValue({
          specialty: profile.specialty || '',
          licenseNumber: profile.licenseNumber || '',
          qualifications: profile.qualifications || '',
          experienceYears: profile.experienceYears || null,
          bio: profile.bio || '',
          consultationFee: profile.consultationFee || null,
          availability: profile.availability || '',
          department: profile.department || '',
        });
        break;
      case 'admin':
        this.adminForm.patchValue({
          department: profile.department || '',
          permissions: profile.permissions || [],
          adminLevel: profile.adminLevel || '',
        });
        break;
    }
  }

  private handleProfileLoadError(error: any): void {
    const message = error?.error?.error || 'Failed to load profile.';
    this.notification.error('Profile load failed', message);
    this.isLoading = false;
  }

  get displayName(): string {
    return this.form.get('fullName')?.value || '';
  }

  handleAvatarError() {
    this.avatarLoadError = true;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter((part) => !!part);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.notification.error('Invalid file', 'Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.notification.error('File too large', 'Image must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImageDataUrl = reader.result as string;
      this.profileImage = this.selectedImageDataUrl;
      this.avatarLoadError = false;
      this.form.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    // Validate main form
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validate role-specific form only if it's been modified and has required fields
    switch (this.userRole) {
      case 'doctor':
        if (this.doctorForm.dirty && this.doctorForm.invalid) {
          this.doctorForm.markAllAsTouched();
          return;
        }
        break;
    }

    const updateData = this.buildUpdateData();
    this.isSaving = true;

    this.auth.updateUserProfile(updateData).subscribe({
      next: (response: UserProfileData) => {
        this.isSaving = false;
        this.notification.success('Profile updated', 'Your details have been saved.');

        // Reset dirty state
        this.form.markAsPristine();
        this.patientForm.markAsPristine();
        this.doctorForm.markAsPristine();
        this.adminForm.markAsPristine();

        this.selectedImageDataUrl = null;

        // Update profile image if returned
        if (response.profileImage) {
          this.profileImage = response.profileImage;
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        const message = error?.error?.error ||
          'Failed to update profile. Please check your details and try again.';
        this.notification.error('Update failed', message);
      },
    });
  }

  onCancel(): void {
    // Reset form to original values
    if (this.originalData) {
      this.form.patchValue(this.originalData);
    }

    // Reset role-specific forms if they exist
    if (this.userRole === 'patient' && this.patientForm) {
      this.patientForm.reset();
    } else if (this.userRole === 'doctor' && this.doctorForm) {
      this.doctorForm.reset();
    } else if (this.userRole === 'admin' && this.adminForm) {
      this.adminForm.reset();
    }

    // Mark forms as pristine
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
  private buildUpdateData(): any {
    const baseData: any = {
      fullName: this.form.get('fullName')?.value || '',
      phone: this.form.get('phone')?.value || '',
      dateOfBirth: this.form.get('dateOfBirth')?.value || '',
      address: this.form.get('address')?.value || '',
    };

    // Add profile image if changed
    if (this.selectedImageDataUrl) {
      baseData.profileImage = this.selectedImageDataUrl;
    }

    // Add role-specific fields
    switch (this.userRole) {
      case 'patient':
        Object.assign(baseData, {
          medicalHistory: this.patientForm.get('medicalHistory')?.value || '',
          allergies: this.patientForm.get('allergies')?.value || '',
          emergencyContact: this.patientForm.get('emergencyContact')?.value || '',
          insuranceProvider: this.patientForm.get('insuranceProvider')?.value || '',
          insurancePolicyNumber: this.patientForm.get('insurancePolicyNumber')?.value || '',
          bloodType: this.patientForm.get('bloodType')?.value || '',
        });
        break;
      case 'doctor':
        Object.assign(baseData, {
          specialty: this.doctorForm.get('specialty')?.value || '',
          licenseNumber: this.doctorForm.get('licenseNumber')?.value || '',
          qualifications: this.doctorForm.get('qualifications')?.value || '',
          experienceYears: this.doctorForm.get('experienceYears')?.value || null,
          bio: this.doctorForm.get('bio')?.value || '',
          consultationFee: this.doctorForm.get('consultationFee')?.value || null,
          availability: this.doctorForm.get('availability')?.value || '',
          department: this.doctorForm.get('department')?.value || '',
        });
        break;
      case 'admin':
        Object.assign(baseData, {
          department: this.adminForm.get('department')?.value || '',
          permissions: this.adminForm.get('permissions')?.value || [],
          adminLevel: this.adminForm.get('adminLevel')?.value || '',
        });
        break;
    }

    // Remove empty values but keep 0 values for numbers
    return Object.fromEntries(
      Object.entries(baseData).filter(([_, v]) => {
        if (typeof v === 'number') return v !== null && v !== undefined;
        return v !== null && v !== undefined && v !== '';
      })
    );
  }

  openPasswordModal(): void {
    this.passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmNewPassword = false;
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    if (this.isPasswordSaving) return;
    this.showPasswordModal = false;
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid || this.isPasswordSaving) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const pwd = this.passwordForm.getRawValue();
    if (pwd.newPassword !== pwd.confirmNewPassword) {
      this.notification.error('Update failed', 'New password and confirmation do not match.');
      return;
    }

    this.isPasswordSaving = true;
    this.auth.updatePassword(pwd).subscribe({
      next: () => {
        this.isPasswordSaving = false;
        this.showPasswordModal = false;
        this.passwordForm.reset();
        this.notification.success('Password updated', 'Your password has been changed.');
      },
      error: (error: any) => {
        this.isPasswordSaving = false;
        const message = error?.error?.error ||
          'Failed to update password. Please check your details and try again.';
        this.notification.error('Update failed', message);
      },
    });
  }

  openDeleteModal(): void {
    this.deleteForm.reset({ password: '' });
    this.showDeletePassword = false;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.isDeletingAccount) return;
    this.showDeleteModal = false;
  }

  onDeleteAccountSubmit(): void {
    if (this.deleteForm.invalid || this.isDeletingAccount) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    const { password } = this.deleteForm.getRawValue();
    this.isDeletingAccount = true;

    this.auth.deleteAccount(password).subscribe({
      next: () => {
        this.isDeletingAccount = false;
        this.showDeleteModal = false;
        this.notification.success('Account deleted', 'Your account has been deleted.');
        this.router.navigateByUrl('/login');
      },
      error: (error: any) => {
        this.isDeletingAccount = false;
        const message = error?.error?.error ||
          'Failed to delete account. Please check your password and try again.';
        this.notification.error('Delete failed', message);
      },
    });
  }

  isFormDirty(): boolean {
    const baseDirty = this.form.dirty;
    let roleDirty = false;

    switch (this.userRole) {
      case 'patient':
        roleDirty = this.patientForm.dirty;
        break;
      case 'doctor':
        roleDirty = this.doctorForm.dirty;
        break;
      case 'admin':
        roleDirty = this.adminForm.dirty;
        break;
    }

    return baseDirty || roleDirty || this.selectedImageDataUrl !== null;
  }
}
