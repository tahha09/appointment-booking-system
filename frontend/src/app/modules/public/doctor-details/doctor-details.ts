import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../../../core/services/doctor';
import { Doctor } from '../../../models/doctor';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { BookingService } from '../../../core/services/booking.service';
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
  certificateImageIndexes: Record<number, number> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef,
    private bookingService: BookingService
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
          this.initializeCertificateIndexes();
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
    if (!this.doctor) {
      return;
    }
    this.bookingService.startBooking({
      doctor: {
        id: this.doctor.id,
        name: this.doctor.user?.name,
        specialization: this.doctor.specialization?.name,
        fee: this.doctor.consultation_fee,
      },
      extras: { source: 'doctor-details' },
    });
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

  getCertificateImage(images?: string[] | null, index = 0): string | null {
    if (!images || images.length === 0) {
      return null;
    }
    const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
    const selectedImage = images[safeIndex];
    if (!selectedImage) {
      return null;
    }
    if (/^https?:\/\//i.test(selectedImage)) {
      return selectedImage;
    }
    const normalized = selectedImage.replace(/^\/+/, '').replace(/^storage\//i, '');
    return `http://localhost:8000/storage/${normalized}`;
  }

  private initializeCertificateIndexes(): void {
    if (!this.doctor?.certificates) {
      this.certificateImageIndexes = {};
      return;
    }
    const indexes: Record<number, number> = {};
    this.doctor.certificates.forEach((certificate) => {
      const count = certificate.images?.length ?? 0;
      if (count > 0) {
        const prev = this.certificateImageIndexes[certificate.id] ?? 0;
        indexes[certificate.id] = prev % count;
      } else {
        indexes[certificate.id] = 0;
      }
    });
    this.certificateImageIndexes = indexes;
  }

  getCertificateImageAt(certificateId: number): string | null {
    if (!this.doctor?.certificates) {
      return null;
    }
    const certificate = this.doctor.certificates.find((c) => c.id === certificateId);
    if (!certificate?.images || certificate.images.length === 0) {
      return null;
    }
    const index = this.certificateImageIndexes[certificateId] ?? 0;
    const safeIndex = Math.min(Math.max(index, 0), certificate.images.length - 1);
    return this.getCertificateImage(certificate.images, safeIndex);
  }

  changeCertificateSlide(certificateId: number, direction: number): void {
    if (!this.doctor?.certificates) {
      return;
    }
    const certificate = this.doctor.certificates.find((c) => c.id === certificateId);
    if (!certificate?.images || certificate.images.length === 0) {
      return;
    }
    const total = certificate.images.length;
    const current = this.certificateImageIndexes[certificateId] ?? 0;
    const nextIndex = (current + direction + total) % total;
    this.certificateImageIndexes = {
      ...this.certificateImageIndexes,
      [certificateId]: nextIndex,
    };
  }
}
