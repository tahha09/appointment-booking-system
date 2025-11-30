import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, map, catchError } from 'rxjs';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: string;
  profileImage?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface AuthResponseData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_image?: string | null;
  };
  token: string;
  token_type: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterResponse {
  id: number;
  token: string;
}

interface ProfileResponse {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  address: string;
  profileImage: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiBaseUrl = 'http://localhost:8000/api';
  private readonly tokenKey = 'auth_token';
  private readonly roleKey = 'user_role';
  private readonly nameKey = 'user_full_name';
  private readonly emailKey = 'user_email';
  private readonly profileImageKey = 'user_profile_image';
  private token: string | null = null;
  private role: string | null = null;
  private profileImage: string | null = null;
  private name: string | null = null;
  private email: string | null = null;

  constructor(private readonly http: HttpClient) {
    this.token = localStorage.getItem(this.tokenKey);
    this.role = localStorage.getItem(this.roleKey);
    this.profileImage = localStorage.getItem(this.profileImageKey);
    this.name = localStorage.getItem(this.nameKey);
    this.email = localStorage.getItem(this.emailKey);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<AuthResponseData>>(`${this.apiBaseUrl}/login`, payload)
      .pipe(
        map((response) => {
          const { user, token } = response.data;

          this.token = token;
          this.role = user.role;
          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.roleKey, user.role);
          if (user.profile_image) {
            this.setProfileImage(user.profile_image);
          }
          this.name = user.name;
          this.email = user.email;
          localStorage.setItem(this.nameKey, user.name);
          localStorage.setItem(this.emailKey, user.email);

          return { token };
        }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error?.error && (error.error.message || error.error.error)) ||
            'Login failed. Please check your email and password.';

          return throwError(() => ({
            error: { error: message },
          }));
        })
      );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http
      .post<ApiResponse<AuthResponseData>>(`${this.apiBaseUrl}/register`, {
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        profileImage: payload.profileImage,
      })
      .pipe(
        map((response) => {
          const { user, token } = response.data;

          this.token = token;
          this.role = user.role;
          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.roleKey, user.role);
          if (user.profile_image) {
            this.setProfileImage(user.profile_image);
          }
          this.name = user.name;
          this.email = user.email;
          localStorage.setItem(this.nameKey, user.name);
          localStorage.setItem(this.emailKey, user.email);

          return { id: user.id, token };
        }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error?.error && (error.error.message || error.error.error)) ||
            'Registration failed. Please check your details and try again.';

          return throwError(() => ({
            error: { error: message },
          }));
        })
      );
  }

  logout(): void {
    if (this.token) {
      this.http
        .post<ApiResponse<null>>(
          `${this.apiBaseUrl}/logout`,
          {},
          { headers: this.getAuthHeaders() }
        )
        .subscribe({
          next: () => {},
          error: () => {},
        });
    }

    this.token = null;
    this.role = null;
    this.profileImage = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.nameKey);
    localStorage.removeItem(this.emailKey);
    localStorage.removeItem(this.profileImageKey);
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setRole(role: string): void {
    this.role = role;
  }

  getRole(): string | null {
    return this.role;
  }

  isPatient(): boolean {
    return this.getRole() === 'patient';
  }

  setProfileImage(url: string | null): void {
    this.profileImage = url;
    if (url) {
      localStorage.setItem(this.profileImageKey, url);
    } else {
      localStorage.removeItem(this.profileImageKey);
    }
  }

  getProfileImage(): string | null {
    const profileImage = this.profileImage;
  
    if (!profileImage) {
      return null;
    }
    if (profileImage.startsWith('http')) {
    return profileImage;
  } else {
    return `http://localhost:8000/storage/${profileImage}`;
  }
  }

  getUserName(): string | null {
    return this.name;
  }

  getPatientProfile(): Observable<ProfileResponse> {
    return this.http
      .get<ApiResponse<ProfileResponse>>(`${this.apiBaseUrl}/patient/profile`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => {
          const profile = response.data;
          this.setProfileImage(profile.profileImage);
          return profile;
        }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error?.error && (error.error.message || error.error.error)) ||
            'Failed to load profile.';

          return throwError(() => ({
            error: { error: message },
          }));
        })
      );
  }

  updatePatientProfile(update: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
    profileImage?: string | null;
  }): Observable<ProfileResponse> {
    return this.http
      .put<ApiResponse<ProfileResponse>>(`${this.apiBaseUrl}/patient/profile`, update, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => {
          const profile = response.data;
          this.setProfileImage(profile.profileImage);
          return profile;
        }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error?.error && (error.error.message || error.error.error)) ||
            'Failed to update profile.';

          return throwError(() => ({
            error: { error: message },
          }));
        })
      );
  }

  deleteAccount(password: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiBaseUrl}/patient/account`, {
        headers: this.getAuthHeaders(),
        body: { password },
      })
      .pipe(
        map(() => {
          this.token = null;
          this.role = null;
          this.profileImage = null;
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.roleKey);
          localStorage.removeItem(this.nameKey);
          localStorage.removeItem(this.emailKey);
          localStorage.removeItem(this.profileImageKey);
        }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error?.error && (error.error.message || error.error.error)) ||
            'Failed to delete account.';

          return throwError(() => ({
            error: { error: message },
          }));
        })
      );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
