import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8000/api/patient';
  private auth = inject(Auth);

  // Cache storage
  private medicalHistoryCache: any[] | null = null;
  private prescriptionsCache: any[] | null = null;
  private appointmentsCache: any[] | null = null;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  getMedicalHistory(params?: any, forceRefresh: boolean = false): Observable<any> {
    // If we have cached data and don't need to force refresh, return it
    // We only use cache if there are no search params (fetching all data)
    const hasParams = params && Object.keys(params).length > 0;

    if (!hasParams && !forceRefresh && this.medicalHistoryCache) {
      return new Observable(observer => {
        observer.next({ success: true, data: this.medicalHistoryCache });
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/medical-history`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return new Observable(observer => {
      this.http.get(url, { headers: this.getAuthHeaders() }).subscribe({
        next: (response: any) => {
          // Cache the data if we fetched all records (no params)
          if (!hasParams && response.success) {
            this.medicalHistoryCache = response.data;
          }
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  getPrescriptions(params?: any, forceRefresh: boolean = false): Observable<any> {
    // If we have cached data and don't need to force refresh, return it
    // We only use cache if there are no search params (fetching all data)
    const hasParams = params && Object.keys(params).length > 0;

    if (!hasParams && !forceRefresh && this.prescriptionsCache) {
      return new Observable(observer => {
        observer.next({ success: true, data: this.prescriptionsCache });
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/prescriptions`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return new Observable(observer => {
      this.http.get(url, { headers: this.getAuthHeaders() }).subscribe({
        next: (response: any) => {
          // Cache the data if we fetched all records (no params)
          if (!hasParams && response.success) {
            this.prescriptionsCache = response.data;
          }
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  getAppointments(params?: any, forceRefresh: boolean = false): Observable<any> {
    // If we have cached data and don't need to force refresh, return it
    // We only use cache if there are no search params (fetching all data)
    const hasParams = params && Object.keys(params).length > 0;

    if (!hasParams && !forceRefresh && this.appointmentsCache && Array.isArray(this.appointmentsCache)) {
      return new Observable(observer => {
        observer.next({ success: true, data: { appointments: this.appointmentsCache } });
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/appointments`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return new Observable(observer => {
      this.http.get(url, { headers: this.getAuthHeaders() }).subscribe({
        next: (response: any) => {
          // Cache the data if we fetched all records (no params)
          if (!hasParams && response.success) {
            // Clear old cache format and use new format
            this.appointmentsCache = null;
            this.appointmentsCache = response.data.appointments || [];
          }
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
}

