export type BillStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'OPEN' | 'VOID';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'INSURANCE';

export interface Bill {
  bill_id: number;
  patient_id: number;
  appointment_id?: number;
  patient_name?: string;
  amount: string | number;
  total_amount?: string | number;
  paid_amount?: string | number;
  status: BillStatus;
  created_at: string;
  bill_date?: string;
  line_items?: BillLineItem[];
}

export interface BillLineItem {
  description: string;
  amount: number;
  quantity?: number;
  unit_price?: number;
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  patient_id?: number;
  amount: string | number;
  method: PaymentMethod;
  reference?: string;
  transaction_id?: string;
  paid_at: string | null;
  payment_date?: string;
  notes?: string;
}
