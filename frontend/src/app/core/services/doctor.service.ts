import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Doctor } from '../models/doctor.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = environment.doctorServiceUrl;
  private doctorsSubject = new BehaviorSubject<Doctor[]>([]);
  doctors$ = this.doctorsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getDoctors(department?: string): Observable<Doctor[]> {
    let params = new HttpParams();
    if (department) {
      params = params.set('department', department);
    }
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`, { params }).pipe(
      tap(doctors => this.doctorsSubject.next(doctors))
    );
  }

  getDoctor(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${id}`);
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/doctors/departments`);
  }

  createDoctor(doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.apiUrl}/doctors`, doctor).pipe(
      tap(newDoctor => {
        const current = this.doctorsSubject.value;
        this.doctorsSubject.next([...current, newDoctor]);
      })
    );
  }

  updateDoctor(id: number, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/doctors/${id}`, doctor).pipe(
      tap(updatedDoctor => {
        const current = this.doctorsSubject.value;
        const index = current.findIndex(d => d.doctor_id === id);
        if (index > -1) {
          current[index] = updatedDoctor;
          this.doctorsSubject.next([...current]);
        }
      })
    );
  }

  deleteDoctor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/doctors/${id}`).pipe(
      tap(() => {
        const current = this.doctorsSubject.value;
        this.doctorsSubject.next(current.filter(d => d.doctor_id !== id));
      })
    );
  }
}


