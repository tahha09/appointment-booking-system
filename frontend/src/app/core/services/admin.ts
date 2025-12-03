import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, throwError, from, of } from 'rxjs';
import { Auth } from './auth';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  status?: string;
  specialty?: string;
  license_number?: string;
  profile_image?: string;
  profile_image_url?: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty: string;
  license_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  type: string;
  notes?: string | null;
  payment_status?: string | null;
  consultation_fee?: number | null;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingApprovals: number;
  todaysAppointments: number;
  newUsersToday: number;
}

export interface AppointmentReport {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export interface DoctorReport {
  name: string;
  total_appointments: number;
  completed_appointments: number;
  rating: number;
}

export interface SystemActivity {
  action: string;
  user: string;
  time: string;
  type: string;
}

// Pagination interfaces
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8000/api';
  private auth = inject(Auth);

  constructor(private http: HttpClient) { }

  // Helper method to get auth headers - using Auth service
  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();

    if (!token) {
      console.warn('No token found. User might need to login again.');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Get complete dashboard statistics
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      users: this.getUsers(),
      appointments: this.getAppointments(),
      pendingDoctors: this.getPendingDoctors()
    }).pipe(
      map(({ users, appointments, pendingDoctors }: {
        users: PaginatedResponse<User>,
        appointments: PaginatedResponse<Appointment>,
        pendingDoctors: PaginatedResponse<Doctor>
      }) => {
        const today = new Date().toISOString().split('T')[0];

        // Extract data arrays from paginated responses
        const usersData = users.data;
        const appointmentsData = appointments.data;
        const pendingDoctorsData = pendingDoctors.data;

        // Count doctors from users data
        const doctors = usersData.filter((user: any) => user.role === 'doctor');
        const approvedDoctors = doctors.filter((doctor: any) =>
          doctor.status === 'approved' || doctor.status === 'active'
        );

        // Get today's appointments
        const todaysAppointments = appointmentsData.filter((appointment: any) =>
          appointment.date === today
        );

        // Get new users today
        const newUsersToday = usersData.filter((user: any) => {
          const userDate = new Date(user.created_at).toISOString().split('T')[0];
          return userDate === today;
        });

        return {
          totalUsers: usersData.length,
          totalDoctors: approvedDoctors.length,
          totalAppointments: appointmentsData.length,
          pendingApprovals: pendingDoctorsData.length,
          todaysAppointments: todaysAppointments.length,
          newUsersToday: newUsersToday.length
        };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error in getDashboardStats:', error);
        // Return default stats on error
        return of({
          totalUsers: 0,
          totalDoctors: 0,
          totalAppointments: 0,
          pendingApprovals: 0,
          todaysAppointments: 0,
          newUsersToday: 0
        });
      })
    );
  }

  // User Management
  getUsers(): Observable<PaginatedResponse<User>> {
    const headers = this.getAuthHeaders();

    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/admin/users`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading users:', error);
        // Fallback to empty paginated response if error
        return of({
          current_page: 1,
          data: [],
          first_page_url: '',
          from: null,
          last_page: 1,
          last_page_url: '',
          next_page_url: null,
          path: '',
          per_page: 15,
          prev_page_url: null,
          to: null,
          total: 0
        });
      })
    );
  }

  getNewUsersToday(): Observable<User[]> {
    return this.getUsers().pipe(
      map((response: PaginatedResponse<User>) => {
        const users = response.data;
        const today = new Date().toISOString().split('T')[0];
        return users.filter((user: any) => {
          const userDate = new Date(user.created_at).toISOString().split('T')[0];
          return userDate === today;
        });
      })
    );
  }

  getUserById(id: number): Observable<User> {
    const headers = this.getAuthHeaders();

    return this.http.get<User>(`${this.apiUrl}/admin/users/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error loading user ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    const headers = this.getAuthHeaders();

    return this.http.put<User>(`${this.apiUrl}/admin/users/${id}`, data, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error updating user ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    const headers = this.getAuthHeaders();

    return this.http.delete<void>(`${this.apiUrl}/admin/users/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error deleting user ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Doctor Management
  getPendingDoctors(): Observable<PaginatedResponse<Doctor>> {
    const headers = this.getAuthHeaders();

    return this.http.get<PaginatedResponse<Doctor>>(`${this.apiUrl}/admin/doctors/pending`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading pending doctors:', error);
        // Fallback to empty paginated response if error
        return of({
          current_page: 1,
          data: [],
          first_page_url: '',
          from: null,
          last_page: 1,
          last_page_url: '',
          next_page_url: null,
          path: '',
          per_page: 15,
          prev_page_url: null,
          to: null,
          total: 0
        });
      })
    );
  }

  approveDoctor(id: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.put<any>(`${this.apiUrl}/admin/doctors/${id}/approve`, {}, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error approving doctor ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  rejectDoctor(id: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.put<any>(`${this.apiUrl}/admin/doctors/${id}/reject`, {}, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error rejecting doctor ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Appointment Management
  getAppointments(params?: { search?: string; status?: string; page?: number; per_page?: number }): Observable<PaginatedResponse<Appointment>> {
    const headers = this.getAuthHeaders();
    const queryParams: any = {};
    
    if (params?.search) {
      queryParams.search = params.search;
    }
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    if (params?.page) {
      queryParams.page = params.page;
    }
    if (params?.per_page) {
      queryParams.per_page = params.per_page;
    }

    return this.http.get<PaginatedResponse<Appointment>>(`${this.apiUrl}/admin/appointments`, { 
      headers,
      params: queryParams
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading appointments:', error);
        // Fallback to empty paginated response if error
        return of({
          current_page: 1,
          data: [],
          first_page_url: '',
          from: null,
          last_page: 1,
          last_page_url: '',
          next_page_url: null,
          path: '',
          per_page: 5,
          prev_page_url: null,
          to: null,
          total: 0
        });
      })
    );
  }

  getTodaysAppointments(): Observable<Appointment[]> {
    return this.getAppointments().pipe(
      map((response: PaginatedResponse<Appointment>) => {
        const appointments = response.data;
        const today = new Date().toISOString().split('T')[0];
        return appointments.filter((appointment: any) =>
          appointment.date === today
        );
      })
    );
  }

  getAppointmentById(id: number): Observable<Appointment> {
    const headers = this.getAuthHeaders();

    return this.http.get<Appointment>(`${this.apiUrl}/admin/appointments/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error loading appointment ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  updateAppointmentStatus(id: number, status: string): Observable<Appointment> {
    const headers = this.getAuthHeaders();

    return this.http.put<Appointment>(`${this.apiUrl}/admin/appointments/${id}/status`,
      { status },
      { headers }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error updating appointment ${id} status:`, error);
        return throwError(() => error);
      })
    );
  }

  deleteAppointment(id: number): Observable<void> {
    const headers = this.getAuthHeaders();

    return this.http.delete<void>(`${this.apiUrl}/admin/appointments/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error deleting appointment ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Reports
  getAppointmentReport(): Observable<AppointmentReport[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<AppointmentReport[]>(`${this.apiUrl}/admin/reports/appointments`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading appointment report:', error);
        return of([]);
      })
    );
  }

  getDoctorReport(): Observable<DoctorReport[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<DoctorReport[]>(`${this.apiUrl}/admin/reports/doctors`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading doctor report:', error);
        return of([]);
      })
    );
  }

  // Get recent activity
  getRecentActivity(): Observable<SystemActivity[]> {
    return forkJoin({
      recentAppointments: this.getAppointments(),
      recentUsers: this.getUsers(),
      pendingDoctors: this.getPendingDoctors()
    }).pipe(
      map(({ recentAppointments, recentUsers, pendingDoctors }: {
        recentAppointments: PaginatedResponse<Appointment>,
        recentUsers: PaginatedResponse<User>,
        pendingDoctors: PaginatedResponse<Doctor>
      }) => {
        const activities: SystemActivity[] = [];
        const now = new Date();

        // Extract data arrays from paginated responses
        const appointmentsData = recentAppointments.data;
        const usersData = recentUsers.data;
        const pendingDoctorsData = pendingDoctors.data;

        // Process appointments
        appointmentsData.slice(0, 3).forEach((appointment: any) => {
          const timeDiff = Math.floor((now.getTime() - new Date(appointment.created_at).getTime()) / (1000 * 60));
          const timeText = this.getTimeAgoText(timeDiff);

          activities.push({
            action: `Appointment ${appointment.status}`,
            user: `${appointment.patient_name} with ${appointment.doctor_name}`,
            time: timeText,
            type: 'appointment'
          });
        });

        // Process new users
        usersData.slice(0, 2).forEach((user: any) => {
          const timeDiff = Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60));
          const timeText = this.getTimeAgoText(timeDiff);

          activities.push({
            action: 'User account created',
            user: user.name,
            time: timeText,
            type: 'user'
          });
        });

        // Process pending doctors
        pendingDoctorsData.slice(0, 2).forEach((doctor: any) => {
          const timeDiff = Math.floor((now.getTime() - new Date(doctor.created_at).getTime()) / (1000 * 60));
          const timeText = this.getTimeAgoText(timeDiff);

          activities.push({
            action: 'Doctor registration pending',
            user: doctor.name,
            time: timeText,
            type: 'doctor'
          });
        });

        // Sort by time (most recent first)
        return activities.sort((a, b) => {
          const timeA = this.parseTimeAgo(a.time);
          const timeB = this.parseTimeAgo(b.time);
          return timeA - timeB;
        }).slice(0, 5);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading recent activity:', error);
        return of([]);
      })
    );
  }

  private getTimeAgoText(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min ago`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  private parseTimeAgo(timeText: string): number {
    const match = timeText.match(/(\d+)\s*(min|hours?|days?)/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'min': return value;
      case 'hour':
      case 'hours': return value * 60;
      case 'day':
      case 'days': return value * 1440;
      default: return 0;
    }
  }

  // Optional: Test authentication
  testAuth(): Observable<any> {
    const headers = this.getAuthHeaders();

    // Create a simple test endpoint in Laravel or use an existing one
    return this.http.get(`${this.apiUrl}/test-auth`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Auth test failed:', error);
        return throwError(() => error);
      })
    );
  }
}
