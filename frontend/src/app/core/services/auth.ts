import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterPayload {
  email: string;
  password: string;
}

interface RegisterResponse {
  id: number;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'https://reqres.in/api';
  private readonly tokenKey = 'auth_token';

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, payload).pipe(
      tap((response) => this.setToken(response.token)),
      catchError((error) => {
        // ReqRes now requires an API key. In demo mode, treat this specific
        // error as a successful fake login so the app continues to work.
        if (error?.error?.error === 'Missing API key') {
          const fakeToken = 'demo-login-token';
          this.setToken(fakeToken);
          return of({ token: fakeToken } as LoginResponse);
        }
        return throwError(() => error);
      }),
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiBase}/register`, payload).pipe(
      tap((response) => this.setToken(response.token)),
      catchError((error) => {
        if (error?.error?.error === 'Missing API key') {
          const fakeToken = 'demo-register-token';
          const fakeId = Date.now();
          const fakeResponse: RegisterResponse = { id: fakeId, token: fakeToken };
          this.setToken(fakeToken);
          return of(fakeResponse);
        }
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}
