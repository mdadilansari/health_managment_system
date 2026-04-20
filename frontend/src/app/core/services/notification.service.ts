import { Injectable, signal } from '@angular/core';
import { Notification, NotificationType } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<Notification[]>([
    {
      id: 1,
      type: 'APPOINTMENT_CONFIRMED',
      message: 'Appointment #125 has been confirmed for tomorrow at 10:00 AM',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false
    },
    {
      id: 2,
      type: 'PAYMENT_RECEIVED',
      message: 'Payment of ₹5,000 received for Bill #234',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: 3,
      type: 'BILL_REMINDER',
      message: 'Bill #198 is overdue. Please process payment.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      read: true
    },
    {
      id: 4,
      type: 'APPOINTMENT_RESCHEDULED',
      message: 'Appointment #112 has been rescheduled to next Monday',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    }
  ]);

  public readonly allNotifications = this.notifications.asReadonly();

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  markAsRead(id: number): void {
    this.notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  addNotification(type: NotificationType, message: string): void {
    const newNotification: Notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date(),
      read: false
    };
    this.notifications.update(notifications => [newNotification, ...notifications]);
  }

  getIconForType(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      'APPOINTMENT_CONFIRMED': '✅',
      'APPOINTMENT_RESCHEDULED': '🔄',
      'APPOINTMENT_CANCELLED': '❌',
      'PAYMENT_RECEIVED': '💰',
      'BILL_REMINDER': '⚠️'
    };
    return icons[type] || '📢';
  }
}
