import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.appointmentServiceUrl;
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  appointments$ = this.appointmentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAppointments(filters?: {
    status?: string;
    doctor_id?: number;
    patient_id?: number;
    date?: string;
  }): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.doctor_id) params = params.set('doctor_id', filters.doctor_id.toString());
    if (filters?.patient_id) params = params.set('patient_id', filters.patient_id.toString());
    if (filters?.date) params = params.set('date', filters.date);

    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`, { params }).pipe(
      tap(appointments => this.appointmentsSubject.next(appointments))
    );
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/appointments/${id}`);
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/appointments`, appointment).pipe(
      tap(newAppointment => {
        const current = this.appointmentsSubject.value;
        this.appointmentsSubject.next([...current, newAppointment]);
      })
    );
  }

  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/appointments/${id}`, appointment).pipe(
      tap(updatedAppointment => {
        const current = this.appointmentsSubject.value;
        const index = current.findIndex(a => a.appointment_id === id);
        if (index > -1) {
          current[index] = updatedAppointment;
          this.appointmentsSubject.next([...current]);
        }
      })
    );
  }

  cancelAppointment(id: number, cancellation_reason?: string): Observable<Appointment> {
    return this.http.patch<Appointment>(
      `${this.apiUrl}/appointments/${id}/cancel`,
      { cancellation_reason }
    ).pipe(
      tap(cancelledAppointment => {
        const current = this.appointmentsSubject.value;
        const index = current.findIndex(a => a.appointment_id === id);
        if (index > -1) {
          current[index] = cancelledAppointment;
          this.appointmentsSubject.next([...current]);
        }
      })
    );
  }

  completeAppointment(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/appointments/${id}/complete`, {}).pipe(
      tap(updated => {
        const current = this.appointmentsSubject.value;
        const index = current.findIndex(a => a.appointment_id === id);
        if (index > -1) { current[index] = updated; this.appointmentsSubject.next([...current]); }
      })
    );
  }

  noShowAppointment(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/appointments/${id}/no-show`, {}).pipe(
      tap(updated => {
        const current = this.appointmentsSubject.value;
        const index = current.findIndex(a => a.appointment_id === id);
        if (index > -1) { current[index] = updated; this.appointmentsSubject.next([...current]); }
      })
    );
  }

  rescheduleAppointment(id: number, data: { slot_start?: string; slot_end?: string; appointment_date?: string; start_time?: string }): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/appointments/${id}/reschedule`, data).pipe(
      tap(updated => {
        const current = this.appointmentsSubject.value;
        const index = current.findIndex(a => a.appointment_id === id);
        if (index > -1) { current[index] = updated; this.appointmentsSubject.next([...current]); }
      })
    );
  }

  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/appointments/${id}`).pipe(
      tap(() => {
        const current = this.appointmentsSubject.value;
        this.appointmentsSubject.next(current.filter(a => a.appointment_id !== id));
      })
    );
  }

  getAvailableSlots(doctor_id: number, date: string): Observable<string[]> {
    let params = new HttpParams()
      .set('doctor_id', doctor_id.toString())
      .set('date', date);
    return this.http.get<string[]>(`${this.apiUrl}/appointments/slots/available`, { params });
  }
}


