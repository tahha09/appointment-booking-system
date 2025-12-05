import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';
import { Appointment as AppointmentService } from '../../../core/services/appointment';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule, Header, Footer],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss'],
})
export class Payment implements OnInit {
  paymentForm: FormGroup;
  doctorInfo: { id: number | null; name: string; department: string; fee: number } = {
    id: null,
    name: 'Selected Doctor',
    department: 'General Medicine',
    fee: 0,
  };
  minimumDeposit = 0;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  paymentMethods = [
    { value: 'credit_card', label: 'Credit Card', description: 'Visa, Mastercard, Amex' },
    { value: 'online_wallet', label: 'Online Wallet', description: 'PayPal, Apple Pay, etc.' },
    { value: 'bank_transfer', label: 'Bank Transfer', description: 'Wire or local transfer' },
    { value: 'cash', label: 'Cash on Visit', description: 'Pay remaining balance in clinic' },
  ];
  readonly currencyCode = 'USD';
  readonly currencySymbol = '$';
  readonly minAppointmentDate = new Date().toISOString().split('T')[0];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: Auth,
    private appointmentService: AppointmentService
  ) {
    this.paymentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientEmail: ['', [Validators.email]],
      amount: [null, Validators.required],
      appointmentDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(5)]],
      notes: [''],
      paymentMethod: ['credit_card', Validators.required],
      cardNumber: [''],
      cardExpiry: [''],
      cardCvc: [''],
      walletProvider: [''],
      walletEmail: ['', Validators.email],
      bankAccountName: [''],
      bankAccountNumber: [''],
      bankReference: [''],
      cashNotes: [''],
    });
  }

  ngOnInit(): void {
    if (!this.auth.isAuthenticated() || !this.auth.isPatient()) {
      const returnUrl = this.router.url || '/payment';
      this.router.navigate(['/login'], {
        queryParams: { returnUrl },
      });
      return;
    }
    this.route.queryParams.subscribe((params) => {
      this.doctorInfo.id = params?.['doctorId'] ? Number(params['doctorId']) : null;
      this.doctorInfo.name = params?.['doctorName'] || this.doctorInfo.name;
      this.doctorInfo.department = params?.['department'] || this.doctorInfo.department;
      const fee = params?.['fee'] ? Number(params['fee']) : this.doctorInfo.fee;
      this.doctorInfo.fee = isNaN(fee) ? 0 : fee;
      this.minimumDeposit = Number((this.doctorInfo.fee * 0.5).toFixed(2));
      const amountControl = this.paymentForm.get('amount');
      if (amountControl) {
        const minValue = this.minimumDeposit > 0 ? this.minimumDeposit : 0;
        amountControl.setValidators([Validators.required, Validators.min(minValue)]);
        amountControl.updateValueAndValidity();
      }
    });

    this.configureMethodValidators(this.paymentForm.get('paymentMethod')?.value);
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe((method) => {
      this.configureMethodValidators(method);
    });

    this.populatePatientDetails();
  }

  get f() {
    return this.paymentForm.controls;
  }

  get selectedMethod(): string {
    return this.paymentForm.get('paymentMethod')?.value;
  }

  private resetMethodValidators(): void {
    const methodControls = [
      'cardNumber',
      'cardExpiry',
      'cardCvc',
      'walletProvider',
      'walletEmail',
      'bankAccountName',
      'bankAccountNumber',
      'bankReference',
      'cashNotes',
    ];
    methodControls.forEach((control) => {
      const ctrl = this.paymentForm.get(control);
      if (ctrl) {
        ctrl.clearValidators();
        if (control === 'walletEmail') {
          ctrl.setValidators([Validators.email]);
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  private configureMethodValidators(method: string): void {
    this.resetMethodValidators();
    switch (method) {
      case 'credit_card':
        this.f['cardNumber'].setValidators([
          Validators.required,
          Validators.minLength(13),
          Validators.maxLength(19),
        ]);
        this.f['cardExpiry'].setValidators([Validators.required]);
        this.f['cardCvc'].setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(4)]);
        break;
      case 'online_wallet':
        this.f['walletProvider'].setValidators([Validators.required]);
        this.f['walletEmail'].setValidators([Validators.required, Validators.email]);
        break;
      case 'bank_transfer':
        this.f['bankAccountName'].setValidators([Validators.required]);
        this.f['bankAccountNumber'].setValidators([Validators.required]);
        this.f['bankReference'].setValidators([Validators.required]);
        break;
      case 'cash':
        this.f['cashNotes'].setValidators([Validators.required]);
        break;
    }
    Object.keys(this.paymentForm.controls).forEach((key) => {
      this.paymentForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private buildMethodPayload(): Record<string, unknown> {
    const value = this.paymentForm.value;
    switch (this.selectedMethod) {
      case 'credit_card':
        return {
          card_last4: value.cardNumber?.slice(-4),
          expiry: value.cardExpiry,
        };
      case 'online_wallet':
        return {
          provider: value.walletProvider,
          wallet_email: value.walletEmail,
        };
      case 'bank_transfer':
        return {
          account_name: value.bankAccountName,
          account_number: value.bankAccountNumber,
          reference: value.bankReference,
        };
      case 'cash':
      default:
        return {
          instructions: value.cashNotes,
        };
    }
  }

  private populatePatientDetails(): void {
    const cachedName = this.auth.getUserName();
    const cachedEmail = this.auth.getUserEmail();
    this.paymentForm.patchValue({
      patientName: cachedName ?? this.paymentForm.value.patientName,
      patientEmail: cachedEmail ?? this.paymentForm.value.patientEmail,
    });

    this.auth.getUserProfile().subscribe({
      next: (profile) => {
        this.paymentForm.patchValue({
          patientName: profile.fullName || cachedName || this.paymentForm.value.patientName,
          patientEmail: profile.email || cachedEmail || this.paymentForm.value.patientEmail,
        });
      },
      error: () => {
        // ignore profile errors and keep cached values
      },
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    if (!this.doctorInfo.id) {
      this.errorMessage = 'Doctor information is missing.';
      return;
    }
    const amount = Number(this.paymentForm.value.amount);
    if (this.minimumDeposit > 0 && amount < this.minimumDeposit) {
      this.errorMessage = `Please pay at least ${this.minimumDeposit.toFixed(2)} to secure the appointment.`;
      return;
    }

    const appointmentDate = this.paymentForm.value.appointmentDate;
    const startTime = this.paymentForm.value.startTime;
    const endTime = this.paymentForm.value.endTime;
    if (!appointmentDate || !startTime || !endTime) {
      this.paymentForm.markAllAsTouched();
      this.errorMessage = 'Please complete the appointment details.';
      return;
    }
    if (startTime >= endTime) {
      this.errorMessage = 'End time must be after the start time.';
      return;
    }

    const payload = {
      doctor_id: this.doctorInfo.id,
      doctor_name: this.doctorInfo.name,
      doctor_department: this.doctorInfo.department,
      fee: this.doctorInfo.fee,
      amount,
      currency: this.currencyCode,
      payment_method: this.selectedMethod,
      patient_name: this.paymentForm.value.patientName,
      patient_email: this.paymentForm.value.patientEmail,
      payment_details: this.buildMethodPayload(),
    };
    const appointmentPayload = {
      doctor_id: this.doctorInfo.id,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      reason: this.paymentForm.value.reason,
      notes: this.paymentForm.value.notes || undefined,
    };

    const token = this.auth.getToken();
    if (!token) {
      this.errorMessage = 'Please sign in to continue.';
      return;
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    let paymentRecorded = false;
    this.http
      .post('http://localhost:8000/api/public/payments', payload, { headers })
      .pipe(
        tap(() => (paymentRecorded = true)),
        switchMap(() => this.appointmentService.createAppointment(appointmentPayload)),
        finalize(() => (this.submitting = false))
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Payment saved and appointment booked successfully.';
          this.paymentForm.reset({ paymentMethod: 'credit_card' });
          this.configureMethodValidators('credit_card');
          void this.router.navigate(['/patient/my-appointments']);
        },
        error: (err) => {
          if (paymentRecorded) {
            const baseMessage =
              err?.error?.message ||
              'The appointment could not be booked after completing the payment. Please contact support.';
            this.errorMessage = `Payment saved but appointment booking failed: ${baseMessage}`;
            return;
          }
          if (err?.status === 401 || err?.status === 403) {
            this.errorMessage = 'Your session has expired. Please sign in again to continue.';
            return;
          }
          if (err?.status === 422 && err?.error?.message) {
            this.errorMessage = err.error.message;
            return;
          }
          this.errorMessage =
            err?.error?.message || 'Unable to process the payment at the moment. Please try again.';
        },
      });
  }
}
