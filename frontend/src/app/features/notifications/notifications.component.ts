import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);
  
  notifications = this.notificationService.allNotifications;

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  getTimeAgo(timestamp: string | Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  getIcon(type: string): string {
    const iconMap: Record<string, string> = {
      APPOINTMENT_CONFIRMED:   '📅',
      APPOINTMENT_COMPLETED:   '✅',
      APPOINTMENT_RESCHEDULED: '🔄',
      APPOINTMENT_CANCELLED:   '❌',
      APPOINTMENT_NO_SHOW:     '🚫',
      PAYMENT_RECEIVED:        '💳',
      PAYMENT_REFUND:          '↩️',
      BILL_GENERATED:          '🧾',
      BILL_REMINDER:           '⚠️',
    };
    return iconMap[type] || '🔔';
  }
}
