import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  constructor(private readonly bookingService: BookingService) {}

  bookAppointment(): void {
    this.bookingService.startBooking({ extras: { source: 'footer' } });
  }
}
