import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getDoctorById(id: number): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.apiUrl}/${id}`);
  }

  getTopDoctors(limit: number): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${this.apiUrl}/top-rated?limit=${limit}`);
  }
}
