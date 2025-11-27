import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly notification = inject(Notification);

  isSubmitting = false;
  apiError = '';
  showScrollTop = false;
  scrollProgress = 0;
  showPassword = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = doc.scrollHeight - doc.clientHeight;
    this.showScrollTop = height > 0 && scrollTop > 80;
    this.scrollProgress = height > 0 ? Math.min(100, Math.round((scrollTop / height) * 100)) : 0;
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

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    if (!email || !password) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = '';

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notification
          .success('Login successful', 'You are now logged in.', {
            confirmButtonText: 'Go to dashboard',
          })
          .then(() => this.router.navigateByUrl('/'));
      },
      error: (error) => {
        this.isSubmitting = false;
        this.apiError =
          error?.error?.error || 'Login failed. Please check your email and password.';
        this.notification.error('Login failed', this.apiError);
      },
    });
  }
}
