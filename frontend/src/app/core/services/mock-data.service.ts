import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Patient } from '../models/patient.model';
import { Doctor } from '../models/doctor.model';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { Bill, Payment } from '../models/billing.model';
import { Prescription } from '../models/prescription.model';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // Mock Patients
  private patients: Patient[] = Array.from({ length: 60 }, (_, i) => ({
    patient_id: i + 1,
    name: `Patient ${i + 1}`,
    email: `patient${i + 1}@test.com`,
    phone: `98${String(i + 1).padStart(8, '0')}`,
    dob: '1980-01-01',
    created_at: new Date(2024, 0, i + 1).toISOString(),
    is_active: true
  }));

  // Mock Doctors
  private doctors: Doctor[] = [
    { doctor_id: 1, name: 'Dr. Sarah Johnson', email: 'sarah.j@hms.com', phone: '9876543210', department: 'Cardiology', specialization: 'Interventional Cardiology', created_at: new Date().toISOString(), is_active: true },
    { doctor_id: 2, name: 'Dr. Michael Chen', email: 'michael.c@hms.com', phone: '9876543211', department: 'Pediatrics', specialization: 'Neonatology', created_at: new Date().toISOString(), is_active: true },
    { doctor_id: 3, name: 'Dr. Emily Williams', email: 'emily.w@hms.com', phone: '9876543212', department: 'Neurology', specialization: 'Stroke Care', created_at: new Date().toISOString(), is_active: true },
    { doctor_id: 4, name: 'Dr. James Brown', email: 'james.b@hms.com', phone: '9876543213', department: 'Orthopedics', specialization: 'Joint Replacement', created_at: new Date().toISOString(), is_active: true },
    { doctor_id: 5, name: 'Dr. Lisa Davis', email: 'lisa.d@hms.com', phone: '9876543214', department: 'Dermatology', specialization: 'Cosmetic Dermatology', created_at: new Date().toISOString(), is_active: true }
  ];

  // Mock Appointments
  private appointments: Appointment[] = Array.from({ length: 50 }, (_, i) => ({
    appointment_id: i + 1,
    patient_id: (i % 60) + 1,
    doctor_id: (i % 5) + 1,
    patient_name: `Patient ${(i % 60) + 1}`,
    doctor_name: this.doctors[(i % 5)].name,
    department: this.doctors[(i % 5)].department,
    slot_start: new Date(2026, 3, 20 + Math.floor(i / 10), 9 + (i % 8), 0).toISOString(),
    slot_end: new Date(2026, 3, 20 + Math.floor(i / 10), 9 + (i % 8), 30).toISOString(),
    status: (['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as AppointmentStatus[])[i % 4],
    created_at: new Date(2026, 3, 15 + Math.floor(i / 20)).toISOString(),
    reschedule_count: 0
  }));

  // Mock Bills
  private bills: Bill[] = Array.from({ length: 30 }, (_, i) => ({
    bill_id: i + 1,
    patient_id: (i % 60) + 1,
    appointment_id: i + 1,
    patient_name: `Patient ${(i % 60) + 1}`,
    amount: 500 + (i * 50),
    status: (['OPEN', 'PAID', 'VOID'])[i % 3] as any,
    created_at: new Date(2026, 3, 15 + i).toISOString(),
    line_items: [
      { description: 'Consultation', amount: 300 },
      { description: 'Medications', amount: 150 + (i * 30) },
      { description: 'Tax (5%)', amount: (450 + (i * 30)) * 0.05 }
    ]
  }));

  // Mock Prescriptions
  private prescriptions: Prescription[] = Array.from({ length: 40 }, (_, i) => ({
    prescription_id: i + 1,
    appointment_id: i + 1,
    patient_id: (i % 60) + 1,
    doctor_id: (i % 5) + 1,
    patient_name: `Patient ${(i % 60) + 1}`,
    doctor_name: this.doctors[(i % 5)].name,
    medication: ['Paracetamol', 'Amoxicillin', 'Ibuprofen'][i % 3],
    dosage: '1-0-1',
    days: 5 + (i % 10),
    issued_at: new Date(2026, 3, 15 + i).toISOString()
  }));

  // Mock Notifications
  private notifications: Notification[] = [
    { id: 1, type: 'APPOINTMENT_CONFIRMED', title: 'Appointment Confirmed', message: 'Appointment confirmed for Patient 1', created_at: new Date().toISOString(), read: false },
    { id: 2, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'Payment of ₹500 received', created_at: new Date().toISOString(), read: false },
    { id: 3, type: 'BILL_REMINDER', title: 'Bill Reminder', message: 'Bill #123 is due', created_at: new Date().toISOString(), read: true }
  ];

  // Getters with Observable (simulating API calls)
  getPatients(): Observable<Patient[]> {
    return of(this.patients).pipe(delay(300));
  }

  getPatient(id: number): Observable<Patient | undefined> {
    return of(this.patients.find(p => p.patient_id === id)).pipe(delay(200));
  }

  getDoctors(department?: string): Observable<Doctor[]> {
    const filtered = department 
      ? this.doctors.filter(d => d.department === department)
      : this.doctors;
    return of(filtered).pipe(delay(300));
  }

  getDepartments(): Observable<string[]> {
    const deps = [...new Set(this.doctors.map(d => d.department))];
    return of(deps).pipe(delay(200));
  }

  getAppointments(filters?: any): Observable<Appointment[]> {
    let filtered = this.appointments;
    if (filters?.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters?.doctor_id) {
      filtered = filtered.filter(a => a.doctor_id === filters.doctor_id);
    }
    return of(filtered).pipe(delay(300));
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    const newAppointment: Appointment = {
      ...appointment as Appointment,
      appointment_id: this.appointments.length + 1,
      status: 'SCHEDULED',
      created_at: new Date().toISOString(),
      reschedule_count: 0
    };
    this.appointments.push(newAppointment);
    return of(newAppointment).pipe(delay(500));
  }

  getBills(status?: string): Observable<Bill[]> {
    const filtered = status 
      ? this.bills.filter(b => b.status === status)
      : this.bills;
    return of(filtered).pipe(delay(300));
  }

  getPrescriptions(): Observable<Prescription[]> {
    return of(this.prescriptions).pipe(delay(300));
  }

  getNotifications(): Observable<Notification[]> {
    return of(this.notifications).pipe(delay(200));
  }

  getUnreadCount(): Observable<number> {
    return of(this.notifications.filter(n => !n.read).length).pipe(delay(100));
  }

  markAsRead(id: number): Observable<boolean> {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return of(true).pipe(delay(200));
  }
}
