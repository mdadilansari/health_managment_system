import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Notification, NotificationType } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3007/v1';

  private notifications = signal<Notification[]>([]);
  public readonly allNotifications = this.notifications.asReadonly();

  constructor() {
    this.loadNotifications();
    // Poll for new notifications every 30 seconds
    setInterval(() => this.loadNotifications(), 30000);
  }

  loadNotifications(): void {
    this.http.get<Notification[]>(`${this.apiUrl}/notifications`).subscribe({
      next: (data) => this.notifications.set(data),
      error: (err) => console.error('Failed to load notifications:', err)
    });
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  markAsRead(id: number): void {
    this.http.patch(`${this.apiUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, read: true } : n)
        );
      },
      error: (err) => console.error('Failed to mark as read:', err)
    });
  }

  markAllAsRead(): void {
    this.http.patch(`${this.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      },
      error: (err) => console.error('Failed to mark all as read:', err)
    });
  }

  addNotification(type: NotificationType, message: string, metadata?: Record<string, any>): void {
    const titleMap: Record<NotificationType, string> = {
      APPOINTMENT_CONFIRMED:   'Appointment Confirmed',
      APPOINTMENT_COMPLETED:   'Appointment Completed',
      APPOINTMENT_RESCHEDULED: 'Appointment Rescheduled',
      APPOINTMENT_CANCELLED:   'Appointment Cancelled',
      APPOINTMENT_NO_SHOW:     'Patient No-Show',
      PAYMENT_RECEIVED:        'Payment Received',
      PAYMENT_REFUND:          'Refund Processed',
      BILL_GENERATED:          'Bill Generated',
      BILL_REMINDER:           'Bill Reminder',
    };

    this.http.post<Notification>(`${this.apiUrl}/notifications`, {
      type,
      title: titleMap[type] || type,
      message,
      metadata
    }).subscribe({
      next: (created) => {
        this.notifications.update(list => [created, ...list]);
      },
      error: (err) => console.error('Failed to create notification:', err)
    });
  }
}

