import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
})
export class AboutUs {
  constructor(private readonly bookingService: BookingService) {}

  bookAppointment(): void {
    this.bookingService.startBooking({ extras: { source: 'about' } });
  }
}
