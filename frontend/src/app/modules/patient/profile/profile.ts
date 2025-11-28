import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class PatientProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly notification = inject(Notification);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }],
    phone: [''],
    dateOfBirth: [''],
    address: [''],
    bloodType: [''],
    allergies: [''],
    chronicConditions: [''],
  });

  ngOnInit(): void {
    const profile = this.auth.getCurrentUserProfile();

    if (profile) {
      this.form.patchValue({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        bloodType: profile.bloodType,
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
      });
    } else {
      this.form.patchValue({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        dateOfBirth: '1990-05-20',
        address: '123 Health Street, Wellness City',
        bloodType: 'O+',
        allergies: 'Peanuts, Penicillin',
        chronicConditions: 'Hypertension',
      });
    }
  }

  get displayName(): string {
    return this.form.get('fullName')?.value || '';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((part) => part)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.auth.updateCurrentUserProfile({
      fullName: raw.fullName || '',
      phone: raw.phone || '',
      dateOfBirth: raw.dateOfBirth || '',
      address: raw.address || '',
      bloodType: raw.bloodType || '',
      allergies: raw.allergies || '',
      chronicConditions: raw.chronicConditions || '',
    });

    this.notification.success('Profile updated', 'Your details have been saved.');
  }
}
