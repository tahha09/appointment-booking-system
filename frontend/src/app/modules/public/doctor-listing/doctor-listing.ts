import { Component, OnInit } from '@angular/core';
import { Doctor, DoctorResponse, DoctorsListResponse } from '../../../models/doctor';
import { DoctorService } from '../../../core/services/doctor';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { he } from 'date-fns/locale';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { BookingService } from '../../../core/services/booking.service';
@Component({
  selector: 'app-doctor-listing',
  standalone: true,
  imports: [CommonModule,Header,Footer],
  templateUrl: './doctor-listing.html',
  styleUrls: ['./doctor-listing.scss']
})

export class DoctorListing implements OnInit {
  doctors: Doctor[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    this.doctorService.getDoctors().subscribe({
      next: (response: DoctorResponse) => {

        // Handle the response based on its structure
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            // Case 1: data is directly an array of doctors
            this.doctors = response.data;
          } else if ('doctors' in response.data) {
            // Case 2: data has a doctors property (DoctorsListResponse)
            this.doctors = response.data.doctors;
          } else {
            // Case 3: data is a single doctor object (wrap in array)
            this.doctors = [response.data as any];
          }
        } else {
          this.doctors = [];
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Failed to load doctors. Please try again later.';
        this.loading = false;
        console.error('Error loading doctors:', error);
      }
    });
  }

  getStarRating(rating: string): number[] {
    const numericRating = parseFloat(rating);
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    const stars = Array(fullStars).fill(1);
    if (hasHalfStar) stars.push(0.5);
    while (stars.length < 5) stars.push(0);

    return stars;
  }

  bookAppointment(doctor: Doctor): void {
    if (!doctor) {
      return;
    }
    this.bookingService.startBooking({
      doctor: {
        id: doctor.id,
        name: doctor.user?.name,
        specialization: doctor.specialization?.name,
        fee: doctor.consultation_fee,
      },
      extras: { source: 'doctor-listing' },
    });
  }

  // Method to view doctor details
  viewDoctorDetails(doctor: Doctor): void {
    this.router.navigate(['/doctors', doctor.id]);
  }

}
