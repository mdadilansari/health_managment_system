export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  department: string;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus;
  created_at: string;
  reschedule_count?: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  held?: boolean;
}
