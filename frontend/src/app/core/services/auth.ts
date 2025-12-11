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
  specializationId?: string;
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

// Updated Profile Response for unified controller
interface ProfileResponse {
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  profileImage?: string;
  role: 'patient' | 'doctor' | 'admin' | 'staff'; // Change from string to union type

  // Patient specific
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;

  // Doctor specific
  specialty?: string;
  licenseNumber?: string;
  qualifications?: string;
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
  availability?: string;
  department?: string;

  // Admin specific
  permissions?: any[];
  adminLevel?: string;
}

// Update Profile Request interface
interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  profileImage?: string | null;

  // Patient specific
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;

  // Doctor specific
  specialty?: string;
  licenseNumber?: string;
  qualifications?: string;
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
  availability?: string;
  department?: string;

  // Admin specific
  permissions?: any[];
  adminLevel?: string;
}

interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiBaseUrl = 'http://localhost:8000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly ID_KEY = 'user_id';
  private readonly ROLE_KEY = 'user_role';
  private readonly NAME_KEY = 'user_name';
  private readonly EMAIL_KEY = 'user_email';
  private readonly PROFILE_IMAGE_KEY = 'profile_image';
  private token: string | null = null;
  private userId: number | null = null;
  private role: string | null = null;
  private profileImage: string | null = null;
  private name: string | null = null;
  private email: string | null = null;

  constructor(private readonly http: HttpClient) {
    // Load persisted data on initialization
    this.token = sessionStorage.getItem(this.TOKEN_KEY);
    const storedId = sessionStorage.getItem(this.ID_KEY);
    this.userId = storedId ? Number(storedId) : null;
    this.role = sessionStorage.getItem(this.ROLE_KEY);
    this.name = sessionStorage.getItem(this.NAME_KEY);
    this.email = sessionStorage.getItem(this.EMAIL_KEY);
    this.profileImage = sessionStorage.getItem(this.PROFILE_IMAGE_KEY);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<AuthResponseData>>(`${this.apiBaseUrl}/login`, payload)
      .pipe(
        map((response) => {
          const { user, token } = response.data;

          this.token = token;
          this.userId = user.id;
          this.role = user.role;
          this.name = user.name;
          this.email = user.email;
          if (user.profile_image) {
            this.profileImage = user.profile_image;
          }

          // Persist to sessionStorage
          sessionStorage.setItem(this.TOKEN_KEY, token);
          sessionStorage.setItem(this.ID_KEY, String(user.id));
          sessionStorage.setItem(this.ROLE_KEY, user.role);
          sessionStorage.setItem(this.NAME_KEY, user.name);
          sessionStorage.setItem(this.EMAIL_KEY, user.email);
          if (user.profile_image) {
            sessionStorage.setItem(this.PROFILE_IMAGE_KEY, user.profile_image);
          }

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
        specializationId: payload.specializationId,
        profileImage: payload.profileImage,
      })
      .pipe(
        map((response) => {
          const { user, token } = response.data;

          // Store in memory only - no localStorage
          this.token = token;
          this.userId = user.id;
          this.role = user.role;
          this.name = user.name;
          this.email = user.email;
          if (user.profile_image) {
            this.profileImage = user.profile_image;
          }

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
    // Clear from memory and sessionStorage immediately
    this.token = null;
    this.userId = null;
    this.role = null;
    this.profileImage = null;
    this.name = null;
    this.email = null;
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.ID_KEY);
    sessionStorage.removeItem(this.ROLE_KEY);
    sessionStorage.removeItem(this.NAME_KEY);
    sessionStorage.removeItem(this.EMAIL_KEY);
    sessionStorage.removeItem(this.PROFILE_IMAGE_KEY);

    // Optionally notify backend (don't wait for response)
    if (this.token) {
      this.http
        .post<ApiResponse<null>>(
          `${this.apiBaseUrl}/logout`,
          {},
          { headers: this.getAuthHeaders() }
        )
        .subscribe({
          next: () => { },
          error: () => { },
        });
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUserId(): number | null {
    return this.userId;
  }

  getUserEmail(): string | null {
    return this.email;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setRole(role: string): void {
    this.role = role;
  }

  setToken(token: string): void {
    this.token = token;
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  setUserSession(user: {
    id: number;
    role: string;
    name: string;
    email: string;
    profile_image?: string | null;
  }): void {
    this.userId = user.id;
    this.role = user.role;
    this.name = user.name;
    this.email = user.email;
    this.setProfileImage(user.profile_image);

    sessionStorage.setItem(this.ID_KEY, String(user.id));
    sessionStorage.setItem(this.ROLE_KEY, user.role);
    sessionStorage.setItem(this.NAME_KEY, user.name);
    sessionStorage.setItem(this.EMAIL_KEY, user.email);

    if (user.profile_image) {
      sessionStorage.setItem(this.PROFILE_IMAGE_KEY, user.profile_image);
    } else {
      sessionStorage.removeItem(this.PROFILE_IMAGE_KEY);
    }
  }

  getRole(): string | null {
    return this.role;
  }

  getUserRole(): string {
    // Return stored role or default to patient
    return this.role || 'patient';
  }

  // NEW: Check if user is a doctor
  isDoctor(): boolean {
    return this.getUserRole() === 'doctor';
  }

  // NEW: Check if user is an admin
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isPatient(): boolean {
    return this.getUserRole() === 'patient';
  }

  setProfileImage(url: string | undefined | null): void {
    this.profileImage = url || null;
  }

  getProfileImage(): string | null {
    const profileImage = this.profileImage;

    if (!profileImage) {
      return null;
    }
    if (profileImage === 'assets/default-avatar.png' || profileImage.includes('/assets/default-avatar.png')) {
      return null;
    }
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    } else {
      return `http://localhost:8000/storage/${profileImage}`;
    }
  }

  getUserName(): string | null {
    return this.name;
  }

  // Unified Profile Methods - use these
  getUserProfile(): Observable<ProfileResponse> {
    return this.http
      .get<ApiResponse<ProfileResponse>>(`${this.apiBaseUrl}/profile`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => {
          const profile = response.data;
          // Update stored profile image
          if (profile.profileImage) {
            this.setProfileImage(profile.profileImage);
            sessionStorage.setItem(this.PROFILE_IMAGE_KEY, profile.profileImage);
          }
          // Update stored name
          if (profile.fullName && profile.fullName !== this.name) {
            this.name = profile.fullName;
            sessionStorage.setItem(this.NAME_KEY, profile.fullName);
          }
          // Update stored role if different
          if (profile.role && profile.role !== this.role) {
            this.role = profile.role;
            sessionStorage.setItem(this.ROLE_KEY, profile.role);
          }
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
  updateUserProfile(update: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http
      .put<ApiResponse<ProfileResponse>>(`${this.apiBaseUrl}/profile`, update, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => {
          const profile = response.data;
          // Update stored profile image
          if (profile.profileImage) {
            this.setProfileImage(profile.profileImage);
            sessionStorage.setItem(this.PROFILE_IMAGE_KEY, profile.profileImage);
          }
          // Update stored name
          if (profile.fullName && profile.fullName !== this.name) {
            this.name = profile.fullName;
            sessionStorage.setItem(this.NAME_KEY, profile.fullName);
          }
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

  updatePassword(update: UpdatePasswordRequest): Observable<void> {
    return this.http
      .patch<ApiResponse<null>>(`${this.apiBaseUrl}/profile/password`, update, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map(() => { }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error?.error && (error.error.message || error.error.error)) ||
            'Failed to update password.';

          return throwError(() => ({
            error: { error: message },
          }));
        })
      );
  }

  deleteAccount(password: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiBaseUrl}/profile`, {
        headers: this.getAuthHeaders(),
        body: { password },
      })
      .pipe(
        map(() => {
          // Clear all stored data on successful deletion
          this.logout();
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

  // Legacy methods - for backward compatibility
  getProfile(): Observable<ProfileResponse> {
    console.warn('getProfile() is deprecated. Use getUserProfile() instead.');
    return this.getUserProfile();
  }

  updateProfile(update: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    profileImage?: string | null;
  }): Observable<ProfileResponse> {
    console.warn('updateProfile() is deprecated. Use updateUserProfile() instead.');
    return this.updateUserProfile(update);
  }

  getPatientProfile(): Observable<ProfileResponse> {
    console.warn('getPatientProfile() is deprecated. Use getUserProfile() instead.');
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
    console.warn('updatePatientProfile() is deprecated. Use updateUserProfile() instead.');
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
