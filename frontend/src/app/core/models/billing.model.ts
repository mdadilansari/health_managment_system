export type BillStatus = 'OPEN' | 'PAID' | 'VOID';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';

export interface Bill {
  bill_id: number;
  patient_id: number;
  appointment_id: number;
  patient_name?: string;
  amount: number;
  status: BillStatus;
  created_at: string;
  line_items?: BillLineItem[];
}

export interface BillLineItem {
  description: string;
  amount: number;
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paid_at: string;
}
