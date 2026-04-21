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
  dropdownOpen = signal(false);

  logout(): void {
    this.authService.logout();
    this.dropdownOpen.set(false);
  }

  getUnreadCount(): number {
    return this.notificationService.getUnreadCount();
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(isOpen => !isOpen);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }
}
