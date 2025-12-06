import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth';

export interface BookingDoctorContext {
  id: number;
  name?: string | null;
  specialization?: string | null;
  fee?: number | string | null;
}

export interface BookingOptions {
  doctor?: BookingDoctorContext;
  extras?: Record<string, string | number | boolean | null | undefined>;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly bookingRoute: string[] = ['/payment'];

  constructor(private readonly router: Router, private readonly auth: Auth) {}

  startBooking(options?: BookingOptions): void {
    const bookingParams = this.buildQueryParams(options);
    const bookingUrlTree = this.router.createUrlTree(this.bookingRoute, {
      queryParams: bookingParams,
    });
    const bookingUrl = bookingUrlTree.toString();

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: bookingUrl },
      });
      return;
    }

    if (!this.auth.isPatient()) {
      alert('Only patients can book appointments. Please sign in with a patient account.');
      return;
    }

    this.router.navigateByUrl(bookingUrl);
  }

  private buildQueryParams(options?: BookingOptions): Record<string, string> {
    const params: Record<string, string> = {};
    if (!options) {
      return params;
    }

    if (options.doctor) {
      const { id, name, specialization, fee } = options.doctor;
      if (id) {
        params['doctorId'] = String(id);
      }
      if (name) {
        params['doctorName'] = name;
      }
      if (specialization) {
        params['department'] = specialization;
      }
      if (fee !== undefined && fee !== null && fee !== '') {
        const numericFee = typeof fee === 'string' ? parseFloat(fee) : fee;
        if (!isNaN(numericFee)) {
          params['fee'] = numericFee.toString();
        }
      }
    }

    if (options.extras) {
      Object.entries(options.extras).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        params[key] = String(value);
      });
    }

    return params;
  }
}
