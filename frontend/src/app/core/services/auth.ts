import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

interface RegisterResponse {
  id: number;
  token: string;
}

interface StoredUser {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: string;
  profileImage?: string | null;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly tokenKey = 'auth_token';
  private readonly roleKey = 'user_role';
  private readonly profileImageKey = 'user_profile_image';
  private readonly nameKey = 'user_full_name';
  private readonly emailKey = 'user_email';
  private readonly usersKey = 'app_users';

  login(payload: LoginPayload): Observable<LoginResponse> {
    const users = this.getStoredUsers();
    const user = users.find((u) => u.email === payload.email);

    if (!user || user.password !== payload.password) {
      return throwError(() => ({
        error: { error: 'Invalid email or password.' },
      }));
    }

    const token = `local-token-${user.id}`;
    this.setToken(token);
    this.setRole(user.role);
    this.setUserInfo(user.fullName, user.email);
    if (user.profileImage) {
      this.setProfileImage(user.profileImage);
    }

    return new Observable<LoginResponse>((observer) => {
      observer.next({ token });
      observer.complete();
    });
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    const users = this.getStoredUsers();

    if (users.some((u) => u.email === payload.email)) {
      return throwError(() => ({
        error: { error: 'This email is already registered.' },
      }));
    }

    const newUser: StoredUser = {
      id: Date.now(),
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    };

    users.push(newUser);
    this.saveStoredUsers(users);

    const token = `local-token-${newUser.id}`;
    this.setToken(token);
    this.setRole(newUser.role);
    this.setUserInfo(newUser.fullName, newUser.email);

    return new Observable<RegisterResponse>((observer) => {
      observer.next({ id: newUser.id, token });
      observer.complete();
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.profileImageKey);
    localStorage.removeItem(this.nameKey);
    localStorage.removeItem(this.emailKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setRole(role: string): void {
    localStorage.setItem(this.roleKey, role);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  isPatient(): boolean {
    return this.getRole() === 'patient';
  }

  setUserInfo(fullName: string, email: string): void {
    localStorage.setItem(this.nameKey, fullName);
    localStorage.setItem(this.emailKey, email);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.nameKey);
  }

  getUserEmail(): string | null {
    return localStorage.getItem(this.emailKey);
  }

  setProfileImage(dataUrl: string): void {
    localStorage.setItem(this.profileImageKey, dataUrl);

    const email = this.getUserEmail();
    if (!email) {
      return;
    }

    const users = this.getStoredUsers();
    const index = users.findIndex((u) => u.email === email);
    if (index !== -1) {
      users[index] = { ...users[index], profileImage: dataUrl };
      this.saveStoredUsers(users);
    }
  }

  getProfileImage(): string | null {
    return localStorage.getItem(this.profileImageKey);
  }

  getCurrentUser(): StoredUser | null {
    const email = this.getUserEmail();
    if (!email) {
      return null;
    }
    const users = this.getStoredUsers();
    return users.find((u) => u.email === email) || null;
  }

  getCurrentUserProfile() {
    const user = this.getCurrentUser();
    if (!user) {
      return null;
    }

    return {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? '',
      dateOfBirth: user.dateOfBirth ?? '',
      address: user.address ?? '',
      bloodType: user.bloodType ?? '',
      allergies: user.allergies ?? '',
      chronicConditions: user.chronicConditions ?? '',
    };
  }

  updateCurrentUserProfile(update: {
    fullName: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    bloodType: string;
    allergies: string;
    chronicConditions: string;
  }): void {
    const email = this.getUserEmail();
    if (!email) {
      return;
    }

    const users = this.getStoredUsers();
    const index = users.findIndex((u) => u.email === email);
    if (index === -1) {
      return;
    }

    const current = users[index];
    const updated: StoredUser = {
      ...current,
      fullName: update.fullName,
      phone: update.phone,
      dateOfBirth: update.dateOfBirth,
      address: update.address,
      bloodType: update.bloodType,
      allergies: update.allergies,
      chronicConditions: update.chronicConditions,
    };

    users[index] = updated;
    this.saveStoredUsers(users);
    this.setUserInfo(updated.fullName, updated.email);
  }

  private getStoredUsers(): StoredUser[] {
    try {
      const raw = localStorage.getItem(this.usersKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveStoredUsers(users: StoredUser[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}
