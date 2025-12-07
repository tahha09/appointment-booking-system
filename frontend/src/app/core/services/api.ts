import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly apiBaseUrl = 'http://localhost:8000/api';

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<T>>(`${this.apiBaseUrl}${endpoint}`, { headers });
  }

  post<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<T>>(`${this.apiBaseUrl}${endpoint}`, data, { headers });
  }

  put<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<T>>(`${this.apiBaseUrl}${endpoint}`, data, { headers });
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse<T>>(`${this.apiBaseUrl}${endpoint}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
