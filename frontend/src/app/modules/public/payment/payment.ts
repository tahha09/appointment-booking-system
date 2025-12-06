import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders, HttpParams } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';
import { Appointment as AppointmentService } from '../../../core/services/appointment';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { DoctorService } from '../../../core/services/doctor';
import { SpecializationService } from '../../../core/services/specialization';
import { Doctor, DoctorResponse } from '../../../models/doctor';
import { Specialization } from '../../../models/specialization.model';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, Header, Footer],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss'],
})
export class Payment implements OnInit {
  paymentForm: FormGroup;
  doctorInfo: { id: number | null; name: string; department: string; fee: number } = this.createDefaultDoctorInfo();
  minimumDeposit = 0;
  submitting = false;
  successMessage = '';
  errorMessage = '';
  doctorDetails: Doctor | null = null;
  doctorLoading = false;
  doctorError = '';
  availableSlots: string[] = [];
  availabilityLoading = false;
  availabilityMessage = '';
  private pendingAvailabilityDate: string | null = null;
  manualSelectionMode = false;
  private manualSelectionInitialized = false;
  specializations: Specialization[] = [];
  specializationLoading = false;
  specializationError = '';
  doctorOptions: Doctor[] = [];
  doctorOptionsLoading = false;
  doctorOptionsError = '';

  private createDefaultDoctorInfo(): { id: number | null; name: string; department: string; fee: number } {
    return {
      id: null,
      name: 'Selected Doctor',
      department: 'General Medicine',
      fee: 0,
    };
  }

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
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private specializationService: SpecializationService,
    private cdr: ChangeDetectorRef,
    private notification: Notification,
  ) {
    this.paymentForm = this.fb.group({
      specializationId: [{ value: null, disabled: true }],
      doctorId: [{ value: null, disabled: true }],
      patientName: ['', Validators.required],
      patientEmail: ['', [Validators.email]],
      amount: [null, Validators.required],
      appointmentDate: [this.minAppointmentDate, Validators.required],
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
    this.setDoctorDependentControlsEnabled(false);
  }

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      const returnUrl = this.router.url || '/payment';
      this.router.navigate(['/login'], {
        queryParams: { returnUrl },
      });
      return;
    }
    if (!this.auth.isPatient()) {
      void this.notification
        .error(
          'Patient account required',
          'Only patients can book appointments. Please switch to a patient account.',
        )
        .then(() => {
          void this.router.navigate(['/']);
        });
      return;
    }
    this.route.queryParams.subscribe((params) => {
      const doctorId = params?.['doctorId'] ? Number(params['doctorId']) : null;
      const doctorName = params?.['doctorName'];
      const department = params?.['department'];
      const feeParam = params?.['fee'] ? Number(params['fee']) : NaN;

      this.doctorInfo = this.createDefaultDoctorInfo();
      if (doctorId) {
        this.doctorInfo.id = doctorId;
      }
      if (doctorName) {
        this.doctorInfo.name = doctorName;
      }
      if (department) {
        this.doctorInfo.department = department;
      }
      if (!isNaN(feeParam)) {
        this.doctorInfo.fee = feeParam;
      }

      const hasDoctor = !!this.doctorInfo.id;
      this.manualSelectionMode = !hasDoctor;
      this.minimumDeposit = this.doctorInfo.fee > 0 ? Number((this.doctorInfo.fee * 0.5).toFixed(2)) : 0;
      this.setAmountValidator(this.minimumDeposit);

      if (hasDoctor && this.doctorInfo.id) {
        this.disableManualSelectionControls();
        this.setDoctorDependentControlsEnabled(true);
        this.paymentForm.patchValue({ doctorId: this.doctorInfo.id }, { emitEvent: false });
        this.loadDoctorDetails(this.doctorInfo.id);
      } else {
        this.manualSelectionMode = true;
        this.initializeManualSelectionControls();
        this.resetManualDoctorSelection();
      }
      this.cdr.detectChanges();
    });

    this.configureMethodValidators(this.paymentForm.get('paymentMethod')?.value);
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe((method) => {
      this.configureMethodValidators(method);
    });
    this.paymentForm.get('appointmentDate')?.valueChanges.subscribe((date) => {
      this.loadAvailability(date);
    });
    this.paymentForm.get('startTime')?.valueChanges.subscribe((slot) => {
      this.updateEndTime(slot);
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

  private setAmountValidator(minValue: number): void {
    const amountControl = this.paymentForm.get('amount');
    if (amountControl) {
      amountControl.setValidators([Validators.required, Validators.min(Math.max(minValue, 0))]);
      amountControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private setDoctorDependentControlsEnabled(enabled: boolean): void {
    const doctorDependentControls = ['amount', 'appointmentDate', 'startTime', 'endTime', 'reason', 'notes'];
    doctorDependentControls.forEach((controlName) => {
      const control = this.paymentForm.get(controlName);
      if (!control) {
        return;
      }
      if (enabled) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    });
  }

  private toggleStartTimeControl(enable: boolean): void {
    const control = this.paymentForm.get('startTime');
    if (!control) {
      return;
    }
    if (enable && control.disabled) {
      control.enable({ emitEvent: false });
    }
    if (!enable && control.enabled) {
      control.disable({ emitEvent: false });
    }
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

  private initializeManualSelectionControls(): void {
    const specializationControl = this.paymentForm.get('specializationId');
    const doctorControl = this.paymentForm.get('doctorId');
    specializationControl?.enable({ emitEvent: false });
    doctorControl?.enable({ emitEvent: false });
    specializationControl?.setValidators([Validators.required]);
    doctorControl?.setValidators([Validators.required]);
    specializationControl?.updateValueAndValidity({ emitEvent: false });
    doctorControl?.updateValueAndValidity({ emitEvent: false });

    if (!this.manualSelectionInitialized) {
      specializationControl?.valueChanges.subscribe((value) => this.onSpecializationSelected(value));
      doctorControl?.valueChanges.subscribe((value) => this.onManualDoctorSelected(value));
      this.manualSelectionInitialized = true;
    }

    if (!this.specializations.length) {
      this.loadSpecializations();
    }
  }

  private disableManualSelectionControls(): void {
    const specializationControl = this.paymentForm.get('specializationId');
    const doctorControl = this.paymentForm.get('doctorId');
    specializationControl?.setValue(null, { emitEvent: false });
    doctorControl?.setValue(null, { emitEvent: false });
    specializationControl?.clearValidators();
    doctorControl?.clearValidators();
    specializationControl?.disable({ emitEvent: false });
    doctorControl?.disable({ emitEvent: false });
    specializationControl?.updateValueAndValidity({ emitEvent: false });
    doctorControl?.updateValueAndValidity({ emitEvent: false });
  }

  private loadSpecializations(): void {
    this.specializationLoading = true;
    this.specializationError = '';
    this.specializationService.getSpecializations().subscribe({
      next: (list) => {
        this.specializations = list;
        this.specializationLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.specializations = [];
        this.specializationLoading = false;
        this.specializationError = 'Unable to load specializations at the moment.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadDoctorsForSpecialization(specializationId: number): void {
    if (!specializationId) {
      this.doctorOptions = [];
      return;
    }
    this.doctorOptionsLoading = true;
    this.doctorOptionsError = '';
    this.doctorService.getDoctorsByFilters({ specialization_id: specializationId }).subscribe({
      next: (response: DoctorResponse) => {
        this.doctorOptions = this.extractDoctorsFromResponse(response);
        if (!this.doctorOptions.length) {
          this.doctorOptionsError = 'No doctors available for the selected specialization.';
        }
        this.doctorOptionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctorOptions = [];
        this.doctorOptionsLoading = false;
        this.doctorOptionsError = 'Failed to load doctors. Please choose another specialization.';
        this.cdr.detectChanges();
      },
    });
  }

  private extractDoctorsFromResponse(response: DoctorResponse): Doctor[] {
    if (!response?.data) {
      return [];
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if ('doctors' in response.data) {
      return (response.data as any).doctors || [];
    }
    return [];
  }

  private onSpecializationSelected(value: unknown): void {
    const specializationId = Number(value);
    this.doctorOptions = [];
    this.doctorOptionsError = '';
    this.paymentForm.get('doctorId')?.setValue(null, { emitEvent: false });
    this.resetManualDoctorSelection();
    if (specializationId) {
      this.loadDoctorsForSpecialization(specializationId);
    }
  }

  private onManualDoctorSelected(value: unknown): void {
    const doctorId = Number(value);
    if (!doctorId) {
      this.resetManualDoctorSelection();
      return;
    }
    const selectedDoctor = this.doctorOptions.find((doctor) => doctor.id === doctorId) || null;
    if (selectedDoctor) {
      const fee = Number(selectedDoctor.consultation_fee);
      this.doctorInfo = {
        id: selectedDoctor.id,
        name: selectedDoctor?.user?.name || 'Selected Doctor',
        department: selectedDoctor?.specialization?.name || 'General Medicine',
        fee: isNaN(fee) ? 0 : fee,
      };
      this.minimumDeposit = this.doctorInfo.fee > 0 ? Number((this.doctorInfo.fee * 0.5).toFixed(2)) : 0;
      this.setAmountValidator(this.minimumDeposit);
    } else {
      this.doctorInfo = this.createDefaultDoctorInfo();
      this.doctorInfo.id = doctorId;
    }
    this.setDoctorDependentControlsEnabled(true);
    this.loadDoctorDetails(doctorId);
    this.cdr.detectChanges();
  }

  private resetManualDoctorSelection(): void {
    this.doctorInfo = this.createDefaultDoctorInfo();
    this.doctorDetails = null;
    this.minimumDeposit = 0;
    this.availableSlots = [];
    this.availabilityMessage = '';
    this.pendingAvailabilityDate = null;
    this.paymentForm.patchValue(
      { amount: null, startTime: '', endTime: '' },
      { emitEvent: false }
    );
    this.setAmountValidator(0);
    if (this.manualSelectionMode) {
      this.setDoctorDependentControlsEnabled(false);
    }
  }

  private loadDoctorDetails(doctorId: number): void {
    this.doctorLoading = true;
    this.doctorError = '';
    this.doctorService.getDoctorById(doctorId).subscribe({
      next: (response: any) => {
        const doctor = Array.isArray(response?.data)
          ? response.data[0]
          : response?.data;
        if (doctor) {
          this.doctorDetails = doctor;
          this.doctorInfo.name = doctor?.user?.name || this.doctorInfo.name;
          this.doctorInfo.department =
            doctor?.specialization?.name || this.doctorInfo.department;
          const fee = Number(doctor?.consultation_fee);
          if (!isNaN(fee)) {
            this.doctorInfo.fee = fee;
            this.minimumDeposit = Number((fee * 0.5).toFixed(2));
            this.setAmountValidator(this.minimumDeposit);
          }
          const dateToCheck =
            this.pendingAvailabilityDate || this.paymentForm.get('appointmentDate')?.value;
          if (dateToCheck) {
            this.loadAvailability(dateToCheck);
          }
        } else {
          this.doctorError = 'Doctor information could not be loaded.';
        }
        this.doctorLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctorLoading = false;
        this.doctorError = 'Failed to load doctor details. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadAvailability(date: string | null): void {
    const startControl = this.paymentForm.get('startTime');
    const clearSlotSelection = () => {
      startControl?.setValue('', { emitEvent: false });
      this.paymentForm.patchValue({ endTime: '' }, { emitEvent: false });
    };

    if (!date) {
      this.pendingAvailabilityDate = null;
      this.availableSlots = [];
      clearSlotSelection();
      this.updateControlError('appointmentDate', 'noSlots', false);
      this.updateControlError('startTime', 'noSlots', false);
      return;
    }
    if (!this.doctorInfo.id) {
      this.pendingAvailabilityDate = date;
      return;
    }
    this.pendingAvailabilityDate = null;
    this.availabilityLoading = true;
    this.availabilityMessage = '';
    this.toggleStartTimeControl(false);
    const params = new HttpParams().set('date', date);
    this.http
      .get<{ success: boolean; data?: { available_slots?: string[]; is_available?: boolean } }>(
        `http://localhost:8000/api/doctors/${this.doctorInfo.id}/availability`,
        { params }
      )
      .subscribe({
        next: (res) => {
          this.availableSlots = res?.data?.available_slots ?? [];
          if (!this.availableSlots.length) {
            this.availabilityMessage = 'No available slots for the selected date.';
            clearSlotSelection();
            this.updateControlError('appointmentDate', 'noSlots', true);
            this.updateControlError('startTime', 'noSlots', true);
            startControl?.markAsTouched();
            this.toggleStartTimeControl(false);
          } else {
            this.availabilityMessage = '';
            this.updateControlError('appointmentDate', 'noSlots', false);
            this.updateControlError('startTime', 'noSlots', false);
            this.toggleStartTimeControl(true);
            const selectedSlot = this.paymentForm.get('startTime')?.value;
            if (!selectedSlot || !this.availableSlots.includes(selectedSlot)) {
              clearSlotSelection();
            } else {
              this.updateEndTime(selectedSlot);
            }
          }
          this.availabilityLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.availableSlots = [];
          this.availabilityMessage =
            'Unable to fetch availability for this doctor. Please pick another date.';
          clearSlotSelection();
          this.updateControlError('appointmentDate', 'noSlots', true);
          this.updateControlError('startTime', 'noSlots', true);
          this.availabilityLoading = false;
          this.toggleStartTimeControl(false);
          this.cdr.detectChanges();
        },
      });
  }

  private updateEndTime(slot: string | null): void {
    if (!slot) {
      this.paymentForm.patchValue({ endTime: '' }, { emitEvent: false });
      return;
    }
    const endTime = this.deriveEndTime(slot);
    this.paymentForm.patchValue({ endTime }, { emitEvent: false });
  }

  private deriveEndTime(slot: string): string {
    if (slot.includes('-')) {
      const [, end] = slot.split('-');
      return end?.trim() || '';
    }
    const [hours, minutes] = slot.split(':').map((part) => parseInt(part, 10));
    if (isNaN(hours) || isNaN(minutes)) {
      return '';
    }
    const base = new Date();
    base.setHours(hours, minutes, 0, 0);
    base.setMinutes(base.getMinutes() + 60);
    return base.toTimeString().slice(0, 5);
  }

  formatSlotLabel(slot: string): string {
    if (!slot) {
      return '';
    }
    if (slot.includes('-')) {
      return slot;
    }
    const endTime = this.deriveEndTime(slot);
    return endTime ? `${slot} - ${endTime}` : slot;
  }

  private updateControlError(controlName: string, errorKey: string, shouldSet: boolean): void {
    const control = this.paymentForm.get(controlName);
    if (!control) {
      return;
    }
    const currentErrors = { ...(control.errors || {}) };
    if (shouldSet) {
      currentErrors[errorKey] = true;
      control.setErrors(currentErrors);
      control.markAsTouched();
    } else if (currentErrors[errorKey]) {
      delete currentErrors[errorKey];
      const hasOtherErrors = Object.keys(currentErrors).length > 0 ? currentErrors : null;
      control.setErrors(hasOtherErrors);
    }
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

    let createdAppointmentId: number | null = null;
    this.appointmentService
      .createAppointment(appointmentPayload)
      .pipe(
        tap((res) => {
          createdAppointmentId = res?.data?.id ?? null;
        }),
        switchMap((res) => {
          const appointmentId = res?.data?.id;
          if (!appointmentId) {
            throw new Error('Appointment was created but no ID was returned.');
          }
          const paymentPayload = {
            ...payload,
            appointment_id: appointmentId,
          };
          return this.http.post('http://localhost:8000/api/public/payments', paymentPayload, {
            headers,
          });
        }),
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
          if (createdAppointmentId) {
            this.appointmentService.cancelAppointment(createdAppointmentId).subscribe({
              error: () => {
                // ignore cancellation error
              },
            });
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

  get appointmentDetailsDisabled(): boolean {
    return !this.doctorInfo.id;
  }
}
