import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class Email {
  
  private apiUrl = 'http://127.0.0.1:8000/api/send-email';

  constructor(private http: HttpClient) { }

  sendEmail(data: { name: string; email: string; message: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
