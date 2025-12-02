import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MedicalHistory,
  PatientMedicalHistoryService,
} from '../../../core/services/patient-medical-history.service';

@Component({
  selector: 'app-medical-history',
  standalone: true,
  templateUrl: './medical-history.html',
  styleUrls: ['./medical-history.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe, // علشان الـ date pipe في الـ HTML
  ],
})
export class MedicalHistoryComponent implements OnInit {
  form!: FormGroup;
  histories: MedicalHistory[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private historyService: PatientMedicalHistoryService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadHistory();
  }

  buildForm(): void {
    this.form = this.fb.group({
      chronic_diseases: [''],
      allergies: [''],
      surgeries: [''],
      medications: [''],
      family_history: [''],
      social_history: [''],
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
      error: () => {
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const payload: MedicalHistory = this.form.value;

    const request = this.editingId
      ? this.historyService.update(this.editingId, payload)
      : this.historyService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.form.reset();
        this.editingId = null;
        this.loadHistory();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  edit(item: MedicalHistory): void {
    this.editingId = item.id ?? null;
    this.form.patchValue({
      chronic_diseases: item.chronic_diseases || '',
      allergies: item.allergies || '',
      surgeries: item.surgeries || '',
      medications: item.medications || '',
      family_history: item.family_history || '',
      social_history: item.social_history || '',
      notes: item.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  delete(item: MedicalHistory): void {
    if (!item.id) return;
    if (!confirm('Are you sure you want to delete this record?')) return;

    this.historyService.delete(item.id).subscribe({
      next: () => this.loadHistory(),
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
  }
}
