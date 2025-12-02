import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  PatientMedicalHistoryService,
  MedicalHistory,
} from '../../../core/services/patient-medical-history.service';
import { Auth } from '../../../core/services/auth';
import Swal from 'sweetalert2';

// 🔹 Angular Material imports مهمين جدًا عشان mat-form-field و matInput و mat-card إلخ
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-medical-history',
  standalone: true,
  templateUrl: './medical-history.html',
  styleUrls: ['./medical-history.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
})
export class MedicalHistoryComponent implements OnInit {
  form!: FormGroup;
  histories: MedicalHistory[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;

  // Options for dropdowns
  chronicDiseasesOptions = [
    'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'Asthma',
    'COPD', 'Arthritis', 'Heart Disease', 'Kidney Disease',
    'Thyroid Disorder', 'Migraine', 'Epilepsy', 'Osteoporosis',
    'Anemia', 'Depression', 'Anxiety', 'Bipolar Disorder',
    'Gastritis', 'GERD', 'Liver Disease', 'High Cholesterol',
    'Other...'
  ];

  allergiesOptions = [
    'Penicillin', 'Peanuts', 'Shellfish', 'Latex', 'Dust Mites',
    'Pollen', 'Cats', 'Dogs', 'Eggs', 'Milk',
    'Soy', 'Wheat', 'Tree Nuts', 'Fish', 'Insect Stings',
    'Mold', 'Perfumes', 'Aspirin', 'Sulfa Drugs', 'Ibuprofen',
    'Other...'
  ];

  surgeriesOptions = [
    'Appendectomy', 'Cholecystectomy', 'C-Section', 'Hip Replacement',
    'Knee Replacement', 'Cataract Surgery', 'Hernia Repair',
    'Tonsillectomy', 'Wisdom Teeth Removal', 'Heart Bypass',
    'Angioplasty', 'Thyroidectomy', 'Hysterectomy', 'Mastectomy',
    'Prostatectomy', 'Spinal Fusion', 'Gastric Bypass', 'LASIK',
    'Other...'
  ];

  medicationsOptions = [
    'Metformin', 'Lisinopril', 'Amlodipine', 'Levothyroxine',
    'Atorvastatin', 'Omeprazole', 'Metoprolol', 'Albuterol',
    'Ibuprofen', 'Aspirin', 'Acetaminophen', 'Simvastatin',
    'Losartan', 'Gabapentin', 'Hydrochlorothiazide', 'Sertraline',
    'Furosemide', 'Pantoprazole', 'Prednisone', 'Amoxicillin',
    'Other...'
  ];

  familyHistoryOptions = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Cancer',
    'Stroke', 'Alzheimer\'s', 'Asthma', 'Mental Illness',
    'Kidney Disease', 'Liver Disease', 'Thyroid Disorder',
    'Autoimmune Disease', 'Obesity', 'Alcoholism', 'Glaucoma',
    'Other...'
  ];

  socialHistoryOptions = [
    'Smoker', 'Non-Smoker', 'Ex-Smoker', 'Social Drinker',
    'Non-Drinker', 'Regular Exercise', 'Sedentary Lifestyle',
    'High Stress Job', 'Vegetarian', 'Vegan', 'Gluten-Free',
    'Married', 'Single', 'Divorced', 'Widowed',
    'Has Pets', 'Travels Frequently', 'Shift Worker',
    'Other...'
  ];

  // UI State for dropdowns
  openDropdown: string | null = null;

  // Track custom inputs for 'Other' option
  customInputs: { [key: string]: string } = {
    chronic_diseases: '',
    allergies: '',
    surgeries: '',
    medications: '',
    family_history: '',
    social_history: ''
  };

  constructor(
    private fb: FormBuilder,
    private historyService: PatientMedicalHistoryService,
    private auth: Auth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadHistory();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      chronic_diseases: [[]], // Store as array in UI
      allergies: [[]],
      surgeries: [[]],
      medications: [[]],
      family_history: [[]],
      social_history: [[]],
      notes: [''],
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.historyService.getAll().subscribe({
      next: (data) => {
        this.histories = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 401) {
          this.handleUnauthorized();
        } else {
          console.error('Error loading medical history:', err);
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const formValue = this.form.value;

    // Convert arrays back to comma-separated strings for backend
    const payload: MedicalHistory = {
      ...formValue,
      chronic_diseases: Array.isArray(formValue.chronic_diseases) ? formValue.chronic_diseases.join(', ') : formValue.chronic_diseases,
      allergies: Array.isArray(formValue.allergies) ? formValue.allergies.join(', ') : formValue.allergies,
      surgeries: Array.isArray(formValue.surgeries) ? formValue.surgeries.join(', ') : formValue.surgeries,
      medications: Array.isArray(formValue.medications) ? formValue.medications.join(', ') : formValue.medications,
      family_history: Array.isArray(formValue.family_history) ? formValue.family_history.join(', ') : formValue.family_history,
      social_history: Array.isArray(formValue.social_history) ? formValue.social_history.join(', ') : formValue.social_history,
    };

    const request = this.editingId
      ? this.historyService.update(this.editingId, payload)
      : this.historyService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        const wasEditing = !!this.editingId; // Capture before clearing

        this.form.reset({
          chronic_diseases: [],
          allergies: [],
          surgeries: [],
          medications: [],
          family_history: [],
          social_history: [],
          notes: ''
        });
        this.editingId = null;
        this.loadHistory();

        Swal.fire({
          title: 'Success!',
          text: wasEditing ? 'Record updated successfully!' : 'Record created successfully!',
          icon: 'success',
          confirmButtonColor: '#0c969c',
          background: '#032f30',
          color: '#e5f4f6',
          timer: 2000
        });
      },
      error: (err) => {
        this.saving = false;
        console.error('Save error:', err);
        
        if (err?.status === 401) {
          this.handleUnauthorized();
          return;
        }

        const errorMessage = err?.error?.message || 
                           err?.error?.error || 
                           'Failed to save the record. Please try again.';
        
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#0c969c',
          background: '#032f30',
          color: '#e5f4f6'
        });
      },
    });
  }

  edit(item: MedicalHistory): void {
    this.editingId = item.id ?? null;

    // Convert comma-separated strings to arrays for UI
    const toArray = (str: string | null | undefined) => str ? str.split(',').map(s => s.trim()).filter(s => s) : [];

    this.form.patchValue({
      chronic_diseases: toArray(item.chronic_diseases),
      allergies: toArray(item.allergies),
      surgeries: toArray(item.surgeries),
      medications: toArray(item.medications),
      family_history: toArray(item.family_history),
      social_history: toArray(item.social_history),
      notes: item.notes || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  delete(item: MedicalHistory): void {
    if (!item.id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0c969c',
      cancelButtonColor: '#f87171',
      confirmButtonText: 'Yes, delete it!',
      background: '#032f30',
      color: '#e5f4f6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.historyService.delete(item.id!).subscribe({
          next: () => {
            this.loadHistory();
            Swal.fire({
              title: 'Deleted!',
              text: 'Your record has been deleted.',
              icon: 'success',
              confirmButtonColor: '#0c969c',
              background: '#032f30',
              color: '#e5f4f6'
            });
          },
          error: (err) => {
            if (err?.status === 401) {
              this.handleUnauthorized();
              return;
            }
            Swal.fire({
              title: 'Error!',
              text: err?.error?.message || 'Failed to delete the record.',
              icon: 'error',
              confirmButtonColor: '#0c969c',
              background: '#032f30',
              color: '#e5f4f6'
            });
          }
        });
      }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      chronic_diseases: [],
      allergies: [],
      surgeries: [],
      medications: [],
      family_history: [],
      social_history: [],
      notes: ''
    });
  }

  // Dropdown Logic
  toggleDropdown(field: string): void {
    this.openDropdown = this.openDropdown === field ? null : field;
  }

  closeDropdown(): void {
    this.openDropdown = null;
  }

  isSelected(field: string, option: string): boolean {
    const currentValues = this.form.get(field)?.value || [];
    return currentValues.includes(option);
  }

  toggleSelection(field: string, option: string): void {
    const control = this.form.get(field);
    if (!control) return;

    // Handle 'Other...' option
    if (option === 'Other...') {
      Swal.fire({
        title: 'Enter Custom Value',
        input: 'text',
        inputPlaceholder: 'Type your custom value...',
        showCancelButton: true,
        confirmButtonColor: '#0c969c',
        cancelButtonColor: '#6c757d',
        background: '#032f30',
        color: '#e5f4f6',
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!';
          }
          return null;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const currentValues = (control.value || []) as string[];
          control.setValue([...currentValues, result.value]);
        }
      });
      return;
    }

    const currentValues = (control.value || []) as string[];
    let newValues: string[];

    if (currentValues.includes(option)) {
      newValues = currentValues.filter(v => v !== option);
    } else {
      newValues = [...currentValues, option];
    }

    control.setValue(newValues);
    control.markAsDirty();
  }

  removeSelection(field: string, option: string): void {
    const control = this.form.get(field);
    if (!control) return;

    const currentValues = (control.value || []) as string[];
    const newValues = currentValues.filter(v => v !== option);

    control.setValue(newValues);
    control.markAsDirty();
  }

  // Check if form has any selections
  get hasSelections(): boolean {
    const fields = ['chronic_diseases', 'allergies', 'surgeries', 'medications', 'family_history', 'social_history'];
    return fields.some(field => {
      const value = this.form.get(field)?.value;
      return Array.isArray(value) && value.length > 0;
    }) || !!this.form.get('notes')?.value;
  }

  // Handle unauthorized access
  private handleUnauthorized(): void {
    Swal.fire({
      title: 'Session Expired',
      text: 'Your session has expired. Please log in again.',
      icon: 'warning',
      confirmButtonColor: '#0c969c',
      background: '#032f30',
      color: '#e5f4f6',
      showCancelButton: false,
      allowOutsideClick: false
    }).then(() => {
      this.auth.logout();
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/patient/medical-history' } 
      });
    });
  }
}
