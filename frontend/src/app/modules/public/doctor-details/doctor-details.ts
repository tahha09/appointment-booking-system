import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../../../core/services/doctor';
import { Doctor } from '../../../models/doctor';
import { Header } from "../../../shared/components/header/header";
import { Footer } from '../../../shared/components/footer/footer';
@Component({
  selector: 'app-doctor-details',
  standalone: true,
  imports: [CommonModule, Header,Footer],
  templateUrl: './doctor-details.html',
  styleUrls: ['./doctor-details.scss']
})
export class DoctorDetails implements OnInit {
  doctor: Doctor | null = null;
  loading: boolean = true;
  error: string = '';
  activeTab: string = 'overview';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadDoctorDetails();
  }

  loadDoctorDetails(): void {
    const doctorId = this.route.snapshot.paramMap.get('id');

    if (!doctorId) {
      this.error = 'Doctor ID not provided';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.doctorService.getDoctorById(+doctorId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.doctor = response.data;
        } else {
          this.error = 'Doctor not found';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Failed to load doctor details. Please try again later.';
        this.loading = false;
        console.error('Error loading doctor details:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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

  bookAppointment(): void {
    if (this.doctor) {
      console.log('Booking appointment with:', this.doctor.user.name);
      alert(`Booking appointment with ${this.doctor.user.name}`);
      // Navigate to booking page
      // this.router.navigate(['/booking', this.doctor.id]);
    }
  }

  // Add these methods to your DoctorDetails class

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getShortBio(bio: string): string {
    const sentences = bio.split('.');
    return sentences.slice(0, 2).join('.') + '.';
  }

  getBioWordCount(bio: string): number {
    return bio.split(/\s+/).length;
  }
  goBack(): void {
    this.router.navigate(['/doctors']);
  }
}
