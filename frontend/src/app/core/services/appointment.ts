import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces inside the service file (or you can import from models)
export interface AppointmentModel {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  reason: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: { id: number; name: string; email: string };
  doctor?: { id: number; user: { id: number; name: string; email: string }; specialization?: { id: number; name: string }; };
}

export interface AppointmentsListResponse {
  success: boolean;
  message: string;
  data: {
    appointments: AppointmentModel[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats?: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
  };
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  data: AppointmentModel;
}

@Injectable({
  providedIn: 'root',
})
export class Appointment {

  private apiUrl = 'http://localhost:8000/api/patient/appointments';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = sessionStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  // Get all appointments
  getAppointments(params?: any): Observable<AppointmentsListResponse> {
    return this.http.get<AppointmentsListResponse>(this.apiUrl, {
      params,
      headers: this.getAuthHeaders()  
    });
  }

  // Get a single appointment by ID
  getAppointmentById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new appointment
  createAppointment(data: any): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.apiUrl, data, {
      headers: this.getAuthHeaders()
    });
  }

  // Cancel an appointment
  cancelAppointment(id: number): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.apiUrl}/${id}/cancel`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  
}