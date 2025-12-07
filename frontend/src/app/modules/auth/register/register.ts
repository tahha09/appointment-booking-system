import { Component, HostListener, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly notification = inject(Notification);
  private readonly api = inject(Api);

  isSubmitting = false;
  apiError = '';
  showScrollTop = false;
  scrollProgress = 0;
  showPassword = false;
  showConfirmPassword = false;
  selectedImagePreview: string | null = null;
  specializations: any[] = [];

  form = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['patient', [Validators.required]],
      specializationId: [''],
    },
    { validators: Register.passwordsMatchValidator },
  );

  ngOnInit(): void {
    this.loadSpecializations();
  }

  loadSpecializations(): void {
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

  static passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (!password || !confirm) {
      return null;
    }
    return password === confirm ? null : { passwordsMismatch: true };
  }

  get passwordsMismatch(): boolean {
    return !!this.form.errors?.['passwordsMismatch'] && this.form.touched;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = doc.scrollHeight - doc.clientHeight;
    this.showScrollTop = height > 0 && scrollTop > 80;
    this.scrollProgress = height > 0 ? Math.min(100, Math.round((scrollTop / height) * 100)) : 0;
  }

  registerWithGoogle(): void {
    window.location.href = 'http://localhost:8000/auth/google';
  }

  scrollToTop(): void {
    const doc = document.documentElement;
    const start = window.scrollY || doc.scrollTop || 0;
    if (start === 0) {
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextScroll = start * (1 - eased);

      window.scrollTo(0, nextScroll);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
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
      this.selectedImagePreview = result;
      // We only persist this after successful registration via Auth service.
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, password, role, specializationId } = this.form.value;
    const specializationIdValue = specializationId || undefined;
    if (!fullName || !email || !password || !role) {
      this.form.markAllAsTouched();
      return;
    }

    // Check if specialization is required for doctors
    if (role === 'doctor' && !specializationIdValue) {
      this.form.get('specializationId')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = '';

    this.auth
      .register({
        fullName,
        email,
        password,
        role,
        specializationId: role === 'doctor' ? specializationIdValue : undefined,
        profileImage: this.selectedImagePreview ?? null,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notification
            .success('Account created', 'Welcome to our platform! Redirecting to home page...', {
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
            })
            .then(() => {
              this.router.navigateByUrl('/');
            });
        },
        error: (error) => {
          this.isSubmitting = false;
          this.apiError =
            error?.error?.error || 'Registration failed. Please check your details and try again.';
          this.notification.error('Registration failed', this.apiError);
        },
      });
  }
}
