export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_NO_SHOW'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REFUND'
  | 'BILL_GENERATED'
  | 'BILL_REMINDER';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  recipient_id?: number;
  recipient_role?: string;
  metadata?: Record<string, any>;
  read: boolean;
  created_at: string;
}
