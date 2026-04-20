export type NotificationType = 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_RESCHEDULED' | 'APPOINTMENT_CANCELLED' | 'PAYMENT_RECEIVED' | 'BILL_REMINDER';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
}
