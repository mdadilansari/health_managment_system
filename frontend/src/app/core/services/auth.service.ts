import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, delay } from 'rxjs';
import { User, UserRole, LoginRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();

  // Mock users for different roles
  private mockUsers: User[] = [
    { id: 1, username: 'admin', name: 'Admin User', email: 'admin@hms.com', role: 'admin' },
    { id: 2, username: 'reception', name: 'Reception Desk', email: 'reception@hms.com', role: 'reception' },
    { id: 3, username: 'doctor', name: 'Dr. Smith', email: 'doctor@hms.com', role: 'doctor' },
    { id: 4, username: 'billing', name: 'Billing Dept', email: 'billing@hms.com', role: 'billing' }
  ];

  constructor(private router: Router) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<User> {
    // Mock login - password is same as username
    const user = this.mockUsers.find(u => 
      u.username === credentials.username && credentials.password === credentials.username
    );

    if (user) {
      const userWithToken = { ...user, token: 'mock-jwt-token-' + user.role };
      this.currentUserSignal.set(userWithToken);
      localStorage.setItem('currentUser', JSON.stringify(userWithToken));
      return of(userWithToken).pipe(delay(500));
    }

    throw new Error('Invalid credentials');
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserSignal();
    return user ? roles.includes(user.role) : false;
  }

  getRole(): UserRole | null {
    return this.currentUserSignal()?.role || null;
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSignal.set(user);
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }
}
