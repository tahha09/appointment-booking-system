import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

type ActionOptions = Pick<
  SweetAlertOptions,
  'confirmButtonText' | 'cancelButtonText' | 'showCancelButton'
>;

@Injectable({
  providedIn: 'root',
})
export class Notification {
  private readonly swal = Swal.mixin({
    background: 'linear-gradient(135deg, #031716 0%, #0A7075 40%, #274D60 100%)',
    color: '#F9FAFB',
    confirmButtonColor: '#0C969C',
    cancelButtonColor: '#6BA3BE',
    showClass: {
      popup: 'swal2-show app-auth-popup-show',
    },
    hideClass: {
      popup: 'swal2-hide app-auth-popup-hide',
    },
    customClass: {
      popup: 'app-auth-popup',
      confirmButton: 'app-auth-confirm-btn',
      cancelButton: 'app-auth-cancel-btn',
      title: 'app-auth-popup-title',
      htmlContainer: 'app-auth-popup-text',
    },
  });

  success(
    title: string,
    text?: string,
    options?: ActionOptions,
  ): Promise<SweetAlertResult<unknown>> {
    return this.fire('success', title, text, options);
  }

  error(title: string, text?: string, options?: ActionOptions): Promise<SweetAlertResult<unknown>> {
    return this.fire('error', title, text, options);
  }

  confirm(
    title: string,
    text?: string,
    options?: ActionOptions,
  ): Promise<SweetAlertResult<unknown>> {
    return this.fire('question', title, text, {
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      ...options,
    });
  }

  private fire(
    icon: SweetAlertIcon,
    title: string,
    text?: string,
    options?: ActionOptions,
  ): Promise<SweetAlertResult<unknown>> {
    const baseOptions: SweetAlertOptions = {
      icon,
      iconColor: icon === 'success' ? '#0C969C' : icon === 'error' ? '#f97373' : '#6BA3BE',
      title,
      text,
      confirmButtonText: 'OK',
      ...options,
    };

    return this.swal.fire(baseOptions);
  }
}
