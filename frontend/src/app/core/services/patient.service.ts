import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:3001/api';
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  patients$ = this.patientsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/patients`).pipe(
      tap(patients => this.patientsSubject.next(patients))
    );
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/patients/${id}`);
  }

  createPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/patients`, patient).pipe(
      tap(newPatient => {
        const current = this.patientsSubject.value;
        this.patientsSubject.next([...current, newPatient]);
      })
    );
  }

  updatePatient(id: number, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/patients/${id}`, patient).pipe(
      tap(updatedPatient => {
        const current = this.patientsSubject.value;
        const index = current.findIndex(p => p.patient_id === id);
        if (index > -1) {
          current[index] = updatedPatient;
          this.patientsSubject.next([...current]);
        }
      })
    );
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/patients/${id}`).pipe(
      tap(() => {
        const current = this.patientsSubject.value;
        this.patientsSubject.next(current.filter(p => p.patient_id !== id));
      })
    );
  }
}
