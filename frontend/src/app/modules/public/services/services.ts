import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services {
  constructor(private readonly bookingService: BookingService) {}

  bookAppointment(mode?: string): void {
    const extras: Record<string, string> = { source: 'services' };
    if (mode) {
      extras['mode'] = mode;
    }
    this.bookingService.startBooking({ extras });
  }
}
