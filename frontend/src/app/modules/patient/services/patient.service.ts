import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Auth } from '../../../core/services/auth';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8000/api/patient';
  private auth = inject(Auth);

  // Cache for medical history and prescriptions
  private medicalHistoryCache: any[] | null = null;
  private prescriptionsCache: any[] | null = null;

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
    // Check if params object is empty (no filters)
    const hasParams = params && Object.keys(params).length > 0;
    
    // If no params and cache exists and not forcing refresh, return cached data
    if (!forceRefresh && !hasParams && this.medicalHistoryCache !== null) {
      return of({
        success: true,
        data: this.medicalHistoryCache,
        message: 'Medical history retrieved successfully'
      });
    }

    let url = `${this.apiUrl}/medical-history`;
    
    if (hasParams) {
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
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((response: any) => {
        // Cache the data only if no filters applied
        if (!hasParams && response.data) {
          this.medicalHistoryCache = response.data;
        }
      })
    );
  }

  getPrescriptions(params?: any, forceRefresh: boolean = false): Observable<any> {
    // Check if params object is empty (no filters)
    const hasParams = params && Object.keys(params).length > 0;
    
    // If no params and cache exists and not forcing refresh, return cached data
    if (!forceRefresh && !hasParams && this.prescriptionsCache !== null) {
      return of({
        success: true,
        data: this.prescriptionsCache,
        message: 'Prescriptions retrieved successfully'
      });
    }

    let url = `${this.apiUrl}/prescriptions`;
    
    if (hasParams) {
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
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((response: any) => {
        // Cache the data only if no filters applied
        if (!hasParams && response.data) {
          this.prescriptionsCache = response.data;
        }
      })
    );
  }

  // Method to clear cache (useful for logout or when data needs refresh)
  clearCache(): void {
    this.medicalHistoryCache = null;
    this.prescriptionsCache = null;
  }

  // Method to clear specific cache
  clearMedicalHistoryCache(): void {
    this.medicalHistoryCache = null;
  }

  clearPrescriptionsCache(): void {
    this.prescriptionsCache = null;
  }
}
