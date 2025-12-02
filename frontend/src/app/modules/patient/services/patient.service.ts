import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '../../../core/services/auth';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8000/api/patient';
  private auth = inject(Auth);

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

  getMedicalHistory(params?: any): Observable<any> {
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
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }
}
