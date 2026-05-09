import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Bill } from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private apiUrl = 'http://localhost:3004/v1';
  private billsSubject = new BehaviorSubject<Bill[]>([]);
  bills$ = this.billsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getBills(filters?: {
    status?: string;
    patient_id?: number;
  }): Observable<Bill[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.patient_id) params = params.set('patient_id', filters.patient_id.toString());

    return this.http.get<Bill[]>(`${this.apiUrl}/bills`, { params }).pipe(
      tap(bills => this.billsSubject.next(bills))
    );
  }

  getBill(id: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/bills/${id}`);
  }

  getBillsByPatient(patient_id: number): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/bills/patient/${patient_id}`);
  }

  createBill(bill: Partial<Bill>): Observable<Bill> {
    return this.http.post<Bill>(`${this.apiUrl}/bills`, bill).pipe(
      tap(newBill => {
        const current = this.billsSubject.value;
        this.billsSubject.next([...current, newBill]);
      })
    );
  }

  updateBill(id: number, bill: Partial<Bill>): Observable<Bill> {
    return this.http.patch<Bill>(`${this.apiUrl}/bills/${id}`, bill).pipe(
      tap(updatedBill => {
        const current = this.billsSubject.value;
        const index = current.findIndex(b => b.bill_id === id);
        if (index > -1) { current[index] = updatedBill; this.billsSubject.next([...current]); }
      })
    );
  }

  payBill(id: number): Observable<Bill> {
    return this.http.patch<Bill>(`${this.apiUrl}/bills/${id}/pay`, {}).pipe(
      tap(updatedBill => {
        const current = this.billsSubject.value;
        const index = current.findIndex(b => b.bill_id === id);
        if (index > -1) { current[index] = updatedBill; this.billsSubject.next([...current]); }
      })
    );
  }

  voidBill(id: number): Observable<Bill> {
    return this.http.patch<Bill>(`${this.apiUrl}/bills/${id}/void`, {}).pipe(
      tap(updatedBill => {
        const current = this.billsSubject.value;
        const index = current.findIndex(b => b.bill_id === id);
        if (index > -1) { current[index] = updatedBill; this.billsSubject.next([...current]); }
      })
    );
  }

  deleteBill(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bills/${id}`).pipe(
      tap(() => {
        const current = this.billsSubject.value;
        this.billsSubject.next(current.filter(b => b.bill_id !== id));
      })
    );
  }
}

