import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly apiUrl = 'http://localhost:8000/api/shared';

  constructor(private http: HttpClient) {}
  private getAuthHeaders(): HttpHeaders | undefined {
      const token = sessionStorage.getItem('auth_token');
      return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications`, {
      headers: this.getAuthHeaders(),
    });
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {}, 
      {headers: this.getAuthHeaders()}
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/read-all`, {},
      {headers: this.getAuthHeaders()}
    );
  }

}
