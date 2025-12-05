import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { Doctor, DoctorResponse } from '../../../models/doctor';
import { DoctorService } from '../../../core/services/doctor';
import { Auth } from '../../../core/services/auth';

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
    private router: Router,
    private auth: Auth
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
    this.doctorService.getTopDoctors(3).subscribe({
      next: (response: DoctorResponse) => {
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            this.topDoctors = response.data;
          } else if ('doctors' in response.data) {
            this.topDoctors = (response.data as any).doctors || [];
          } else {
            this.topDoctors = [response.data as Doctor];
          }
        } else {
          this.topDoctors = [];
        }
        this.loadingTopDoctors = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
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

  startBooking(doctor: Doctor): void {
    if (!doctor) {
      return;
    }
    const queryParams: { [key: string]: unknown } = {
      doctorId: doctor.id,
      doctorName: doctor?.user?.name,
      department: doctor?.specialization?.name,
      fee: doctor?.consultation_fee,
    };
    const paymentUrl = this.router.createUrlTree(['/payment'], { queryParams }).toString();

    if (!this.auth.isAuthenticated() || !this.auth.isPatient()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: paymentUrl },
      });
      return;
    }

    this.router.navigateByUrl(paymentUrl);
  }
}
