import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient) {}

  // Method to fetch user data from API
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/user/current');
  }

  // Set user data (call this after login or when fetching user data)
  setUser(user: User): void {
    this.currentUser.next(user);
  }

  // Get current user role
  getCurrentUserRole(): string | null {
    return this.currentUser.value?.role || null;
  }

  // Get current user data
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }
}
