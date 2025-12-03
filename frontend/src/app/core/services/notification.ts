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
    background: 'white',
    color: '#1e293b',
    confirmButtonColor: '#0c969c',
    cancelButtonColor: '#64748b',
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
      iconColor: icon === 'success' ? '#0c969c' : icon === 'error' ? '#ef4444' : '#64748b',
      title,
      text,
      confirmButtonText: 'OK',
      ...options,
    };

    return this.swal.fire(baseOptions);
  }
}
