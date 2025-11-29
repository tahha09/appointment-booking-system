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

  profileImage: string | null = null;

  bloodTypes: string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

  chronicConditionOptions: string[] = [
    'Hypertension',
    'Diabetes',
    'Asthma',
    'Heart disease',
    'Kidney disease',
    'Arthritis',
    'High cholesterol',
    'Chronic lung disease (COPD)',
    'Thyroid disorder',
    'Depression or anxiety',
    'Obesity',
    'Autoimmune disease',
    'Liver disease',
    'Stroke (history)',
    'Migraine',
    'Cancer (history)',
    'None',
  ];

  allergyOptions: string[] = [
    'No allergies',
    'Penicillin',
    'Peanuts',
    'Shellfish',
    'Milk / dairy',
    'Eggs',
    'Soy',
    'Insect stings',
    'NSAIDs (e.g. ibuprofen)',
    'Tree nuts',
    'Fish',
    'Wheat / gluten',
    'Pollen',
    'Dust mites',
    'Animal dander',
    'Latex',
    'Other',
  ];

  chronicSelected: string[] = [];
  allergySelected: string[] = [];

  form = this.fb.group({
    fullName: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: this.fb.control({ value: '', disabled: true }),
    phone: this.fb.control(''),
    dateOfBirth: this.fb.control(''),
    address: this.fb.control(''),
    bloodType: this.fb.control(''),
    allergies: this.fb.control<string[]>([]),
    chronicConditions: this.fb.control<string[]>([]),
  });

  ngOnInit(): void {
    this.profileImage = this.auth.getProfileImage();

    const profile = this.auth.getCurrentUserProfile();

    if (profile) {
      const chronicValues = this.parseMulti(profile.chronicConditions);
      const allergyValues = this.parseMulti(profile.allergies);

      this.form.patchValue({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        bloodType: profile.bloodType,
        allergies: allergyValues,
        chronicConditions: chronicValues,
      });

      this.chronicSelected = chronicValues;
      this.allergySelected = allergyValues;
    } else {
      this.form.patchValue({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        dateOfBirth: '1990-05-20',
        address: '123 Health Street, Wellness City',
        bloodType: 'O+',
        allergies: ['Peanuts', 'Penicillin'],
        chronicConditions: ['Hypertension'],
      });

      this.chronicSelected = ['Hypertension'];
      this.allergySelected = ['Peanuts', 'Penicillin'];
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

    const bloodType = raw.bloodType || '';
    const chronicConditions = Array.isArray(raw.chronicConditions)
      ? raw.chronicConditions.join(', ')
      : raw.chronicConditions || '';

    const allergies = Array.isArray(raw.allergies)
      ? raw.allergies.join(', ')
      : raw.allergies || '';

    this.auth.updateCurrentUserProfile({
      fullName: raw.fullName || '',
      phone: raw.phone || '',
      dateOfBirth: raw.dateOfBirth || '',
      address: raw.address || '',
      bloodType,
      allergies,
      chronicConditions,
    });

    this.notification.success('Profile updated', 'Your details have been saved.');
  }

  private parseMulti(value: string | null | undefined): string[] {
    if (!value) {
      return [];
    }
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  private getSelectedArray(controlName: 'chronicConditions' | 'allergies'): string[] {
    const control = this.form.get(controlName);
    const value = control?.value;
    return Array.isArray(value) ? value : [];
  }

  private updateMulti(controlName: 'chronicConditions' | 'allergies', option: string): void {
    const selected = this.getSelectedArray(controlName);
    const exists = selected.includes(option);
    const next = exists ? selected.filter((v) => v !== option) : [...selected, option];
    this.form.get(controlName)?.setValue(next);

    if (controlName === 'chronicConditions') {
      this.chronicSelected = next;
    } else {
      this.allergySelected = next;
    }

    this.form.markAsDirty();
  }

  removeChronic(option: string): void {
    this.updateMulti('chronicConditions', option);
  }

  removeAllergy(option: string): void {
    this.updateMulti('allergies', option);
  }

  onChronicSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    if (!value) {
      return;
    }
    this.updateMulti('chronicConditions', value);
    select.value = '';
  }

  onAllergySelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    if (!value) {
      return;
    }
    this.updateMulti('allergies', value);
    select.value = '';
  }
}
