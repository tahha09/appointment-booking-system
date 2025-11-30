import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { Doctor, DoctorResponse } from '../../../models/doctor';
import { DoctorService } from '../../../core/services/doctor';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, Header, Footer, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  topDoctors: Doctor[] = [];
  loadingTopDoctors = true;
  errorTopDoctors = '';

  constructor(
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchTopDoctors();
  }

  trackByDoctor(_: number, doctor: Doctor): number {
    return doctor.id;
  }

  private fetchTopDoctors(): void {
    this.loadingTopDoctors = true;
    this.errorTopDoctors = '';
    this.doctorService.getTopDoctors(5).subscribe({
      next: (response: DoctorResponse) => {
        console.log('API Response:', response);
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            this.topDoctors = response.data;
            console.log('Top doctors loaded:', this.topDoctors);
          } else if ('doctors' in response.data) {
            this.topDoctors = (response.data as any).doctors || [];
          } else {
            this.topDoctors = [response.data as Doctor];
          }
        } else {
          this.topDoctors = [];
          console.warn('No data in response:', response);
        }
        this.loadingTopDoctors = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching top doctors:', err);
        this.errorTopDoctors =
          err?.error?.message || err?.message || 'Unable to load top rated doctors.';
        this.loadingTopDoctors = false;
        this.cdr.detectChanges();
      },
    });
  }

  viewDoctorProfile(doctor: Doctor): void {
    if (!doctor?.id) {
      return;
    }
    this.router.navigate(['/doctors', doctor.id]);
  }
}