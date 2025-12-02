import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface MedicalHistory {
  id?: number;
  chronic_diseases?: string | null;
  allergies?: string | null;
  surgeries?: string | null;
  medications?: string | null;
  family_history?: string | null;
  social_history?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const API_URL = 'http://localhost:8000/api';

@Injectable({
  providedIn: 'root'
})
export class PatientMedicalHistoryService {

  private baseUrl = `${API_URL}/patient/medical-history`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    console.log('🔐 Auth Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

    if (!token) {
      console.error('❌ No auth token found in localStorage');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleResponse<T>(response: ApiResponse<T>): T {
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'An error occurred');
  }

  getAll(): Observable<MedicalHistory[]> {
    console.log('📋 Fetching all medical history records...');
    return this.http.get<ApiResponse<MedicalHistory[]>>(this.baseUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.handleResponse(response)),
      catchError(error => {
        console.error('Error fetching medical history:', error);
        return throwError(() => error);
      })
    );
  }

  create(data: MedicalHistory): Observable<MedicalHistory> {
    console.log('➕ Creating new medical history record:', data);
    return this.http.post<ApiResponse<MedicalHistory>>(this.baseUrl, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.handleResponse(response)),
      catchError(error => {
        console.error('Error creating medical history:', error);
        return throwError(() => error);
      })
    );
  }

  update(id: number, data: MedicalHistory): Observable<MedicalHistory> {
    console.log('✏️ Updating medical history record:', id);
    return this.http.put<ApiResponse<MedicalHistory>>(`${this.baseUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.handleResponse(response)),
      catchError(error => {
        console.error('Error updating medical history:', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: number): Observable<void> {
    console.log('🗑️ Deleting medical history record:', id);
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting medical history:', error);
        return throwError(() => error);
      })
    );
  }
}
