export interface Patient {
  patient_id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  created_at: string;
  is_active?: boolean;
}
