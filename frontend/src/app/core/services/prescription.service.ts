import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prescription } from '../models/prescription.model';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = 'http://localhost:3006/api';
  private prescriptionsSubject = new BehaviorSubject<Prescription[]>([]);
  prescriptions$ = this.prescriptionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPrescriptions(filters?: {
    patient_id?: number;
    doctor_id?: number;
    appointment_id?: number;
  }): Observable<Prescription[]> {
    let params = new HttpParams();
    if (filters?.patient_id) params = params.set('patient_id', filters.patient_id.toString());
    if (filters?.doctor_id) params = params.set('doctor_id', filters.doctor_id.toString());
    if (filters?.appointment_id) params = params.set('appointment_id', filters.appointment_id.toString());

    return this.http.get<Prescription[]>(`${this.apiUrl}/prescriptions`, { params }).pipe(
      tap(prescriptions => this.prescriptionsSubject.next(prescriptions))
    );
  }

  getPrescription(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/prescriptions/${id}`);
  }

  getPrescriptionsByPatient(patient_id: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/prescriptions/patient/${patient_id}`);
  }

  createPrescription(prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiUrl}/prescriptions`, prescription).pipe(
      tap(newPrescription => {
        const current = this.prescriptionsSubject.value;
        this.prescriptionsSubject.next([...current, newPrescription]);
      })
    );
  }

  updatePrescription(id: number, prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.apiUrl}/prescriptions/${id}`, prescription).pipe(
      tap(updatedPrescription => {
        const current = this.prescriptionsSubject.value;
        const index = current.findIndex(p => p.prescription_id === id);
        if (index > -1) {
          current[index] = updatedPrescription;
          this.prescriptionsSubject.next([...current]);
        }
      })
    );
  }

  deletePrescription(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/prescriptions/${id}`).pipe(
      tap(() => {
        const current = this.prescriptionsSubject.value;
        this.prescriptionsSubject.next(current.filter(p => p.prescription_id !== id));
      })
    );
  }
}
