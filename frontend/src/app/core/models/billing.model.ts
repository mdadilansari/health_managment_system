export type BillStatus = 'OPEN' | 'PAID' | 'VOID' | 'CANCELLED' | 'CHARGED';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'INSURANCE';

export interface Bill {
  bill_id: number;
  patient_id: number;
  appointment_id?: number;
  patient_name?: string;
  amount: string | number;
  status: BillStatus;
  created_at: string;
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  amount: string | number;
  method: PaymentMethod;
  reference?: string;
  paid_at: string | null;
  _idempotent?: boolean;
}
