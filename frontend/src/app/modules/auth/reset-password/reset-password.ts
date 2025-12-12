import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(Notification);

  isSubmitting = false;
  apiError = '';
  showPassword = false;
  showConfirmPassword = false;
  token = '';
  email = '';
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    password_confirmation: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    this.email = this.route.snapshot.queryParams['email'];
    if (!this.token || !this.email) {
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(form: any): any {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, password_confirmation } = this.form.value;
    if (!password || !password_confirmation) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = '';

    this.auth.resetPassword({ token: this.token, email: this.email, password, password_confirmation }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.notification.success(
          'Password Reset Successful',
          'Your password has been reset successfully. Please login with your new password.'
        );

        // Clear the form
        this.form.reset();

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.apiError = error?.error?.error || 'Failed to reset password. Please try again.';
        this.notification.error('Password Reset Failed', this.apiError);
      },
    });
  }
}
