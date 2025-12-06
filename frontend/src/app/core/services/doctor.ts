import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorResponse } from '../../models/doctor';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:8000/api/doctors';

  constructor(private http: HttpClient) { }

  getDoctors(): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(this.apiUrl);
  }

  getDoctorsByFilters(params?: Record<string, string | number | undefined>): Observable<DoctorResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<DoctorResponse>(this.apiUrl, { params: httpParams });
  }

  getDoctorById(id: number): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.apiUrl}/${id}`);
  }

  getTopDoctors(limit: number): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.apiUrl}/top-rated?limit=${limit}`);
  }
}
