import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly notification = inject(Notification);

  isSubmitting = false;
  apiError = '';
  successMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.value;
    if (!email) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Password reset link sent to your email. Please check your inbox.';
        this.notification.success('Reset link sent', this.successMessage);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.apiError = error?.error?.error || 'Failed to send reset link. Please try again.';
        this.notification.error('Failed to send reset link', this.apiError);
      },
    });
  }
}
