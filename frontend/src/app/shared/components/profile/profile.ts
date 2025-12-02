import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    dateOfBirth: [''],
    address: [''],
  });

  protected readonly passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmNewPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  protected readonly deleteForm = this.fb.group({
    password: ['', Validators.required],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isPasswordSaving = signal(false);
  protected readonly isDeletingAccount = signal(false);
  protected readonly showPasswordModal = signal(false);
  protected readonly showDeleteModal = signal(false);
  protected readonly showCurrentPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmNewPassword = signal(false);
  protected readonly showDeletePassword = signal(false);

  protected profileImage: string | null = null;
  protected selectedImageDataUrl: string | null = null;

  constructor() {
    this.loadProfile();
  }

  protected get displayName(): string {
    return this.auth.getUserName() || 'User';
  }

  protected get userRole(): string {
    return this.auth.getUserRole();
  }

  protected getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  protected onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImageDataUrl = e.target?.result as string;
      this.profileImage = this.selectedImageDataUrl;
      this.form.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  protected openPasswordModal(): void {
    this.showPasswordModal.set(true);
    this.passwordForm.reset();
  }

  protected closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.passwordForm.reset();
  }

  protected openDeleteModal(): void {
    this.showDeleteModal.set(true);
    this.deleteForm.reset();
  }

  protected closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteForm.reset();
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;

    this.isSaving.set(true);

    const profile = this.form.getRawValue();

    const updateData = {
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth || '',
      address: profile.address || '',
      profileImage: this.selectedImageDataUrl,
    };

    this.auth.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profileImage = updatedProfile.profileImage;
        this.form.markAsPristine();
        this.isSaving.set(false);
        // TODO: Add success notification
      },
      error: (error) => {
        this.isSaving.set(false);
        // TODO: Add error notification
        console.error('Failed to update profile:', error);
      },
    });
  }

  protected onPasswordSubmit(): void {
    if (this.passwordForm.invalid || this.isPasswordSaving()) return;

    this.isPasswordSaving.set(true);

    const pwd = this.passwordForm.getRawValue();

    this.auth.updatePassword({
      currentPassword: pwd.currentPassword || '',
      newPassword: pwd.newPassword || '',
      confirmNewPassword: pwd.confirmNewPassword || '',
    }).subscribe({
      next: () => {
        this.closePasswordModal();
        this.isPasswordSaving.set(false);
        // TODO: Add success notification
      },
      error: (error) => {
        this.isPasswordSaving.set(false);
        // TODO: Add error notification
        console.error('Failed to update password:', error);
      },
    });
  }

  protected onDeleteAccountSubmit(): void {
    if (this.deleteForm.invalid || this.isDeletingAccount()) return;

    this.isDeletingAccount.set(true);

    const password = this.deleteForm.getRawValue().password || '';

    this.auth.deleteAccount(password).subscribe({
      next: () => {
        this.isDeletingAccount.set(false);
        // Account deletion handled in auth service
      },
      error: (error) => {
        this.isDeletingAccount.set(false);
        // TODO: Add error notification
        console.error('Failed to delete account:', error);
      },
    });
  }

  private loadProfile(): void {
    this.isLoading.set(true);

    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.profileImage = profile.profileImage;

        this.form.patchValue({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth || '',
          address: profile.address,
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        // TODO: Add error notification
        console.error('Failed to load profile:', error);
      },
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmNewPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }
}
