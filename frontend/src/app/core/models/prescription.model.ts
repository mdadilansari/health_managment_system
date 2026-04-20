export interface Prescription {
  prescription_id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  medication: string;
  dosage: string;
  days: number;
  issued_at: string;
}
