import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Payment } from '../models/billing.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.paymentServiceUrl;
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPayments(filters?: {
    patient_id?: number;
    bill_id?: number;
  }): Observable<Payment[]> {
    let params = new HttpParams();
    if (filters?.patient_id) params = params.set('patient_id', filters.patient_id.toString());
    if (filters?.bill_id) params = params.set('bill_id', filters.bill_id.toString());

    return this.http.get<Payment[]>(`${this.apiUrl}/payments`, { params }).pipe(
      tap(payments => this.paymentsSubject.next(payments))
    );
  }

  getPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/payments/${id}`);
  }

  getPaymentsByPatient(patient_id: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/patient/${patient_id}`);
  }

  getPaymentsByBill(bill_id: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/bill/${bill_id}`);
  }

  createPayment(payment: { bill_id: number; amount: number; method: string; }, idempotencyKey?: string): Observable<Payment> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    return this.http.post<Payment>(`${this.apiUrl}/payments`, payment, { headers }).pipe(
      tap(newPayment => {
        const current = this.paymentsSubject.value;
        this.paymentsSubject.next([...current, newPayment]);
      })
    );
  }

  updatePayment(id: number, payment: Partial<Payment>): Observable<Payment> {
    return this.http.put<Payment>(`${this.apiUrl}/payments/${id}`, payment).pipe(
      tap(updatedPayment => {
        const current = this.paymentsSubject.value;
        const index = current.findIndex(p => p.payment_id === id);
        if (index > -1) {
          current[index] = updatedPayment;
          this.paymentsSubject.next([...current]);
        }
      })
    );
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payments/${id}`).pipe(
      tap(() => {
        const current = this.paymentsSubject.value;
        this.paymentsSubject.next(current.filter(p => p.payment_id !== id));
      })
    );
  }
}


