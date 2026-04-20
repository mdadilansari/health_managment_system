export interface Doctor {
  doctor_id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  created_at: string;
  is_active?: boolean;
}

export type Department = 'Cardiology' | 'Pediatrics' | 'Neurology' | 'Dermatology' | 'Orthopedics';
