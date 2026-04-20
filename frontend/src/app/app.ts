import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  protected readonly title = signal('Hospital Management System');

  logout(): void {
    this.authService.logout();
  }

  getUnreadCount(): number {
    return this.notificationService.getUnreadCount();
  }
}
