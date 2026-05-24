import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../../core/services/billing.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { Bill, BillStatus } from '../../../core/models/billing.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-list.component.html',
  styleUrls: ['./billing-list.component.css']
})
export class BillingListComponent implements OnInit {
  private billingService = inject(BillingService);
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private cdr = inject(ChangeDetectorRef);
  
  private patientMap = new Map<number, string>();
  
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  loading: boolean = true;
  error: string = '';
  
  selectedStatus: string = '';
  searchTerm: string = '';
  statusOptions: BillStatus[] = ['OPEN', 'PAID', 'VOID', 'CANCELLED', 'CHARGED'];

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    forkJoin({
      bills: this.billingService.getBills(),
      patients: this.patientService.getPatients()
    }).subscribe({
      next: ({ bills, patients }) => {
        patients.forEach(p => this.patientMap.set(p.patient_id, p.name));
        this.bills = bills.map(b => ({
          ...b,
          patient_name: this.patientMap.get(b.patient_id) || b.patient_name,
        }));
        this.filteredBills = [...this.bills];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bills:', err);
        this.error = 'Failed to load bills';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let filtered = [...this.bills];

    if (this.selectedStatus) {
      filtered = filtered.filter(b => b.status === this.selectedStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.patient_name?.toLowerCase().includes(term) ||
        b.bill_id.toString().includes(term) ||
        b.patient_id.toString().includes(term)
      );
    }

    this.filteredBills = filtered;
  }

  getStatusClass(status: BillStatus): string {
    const statusMap: Record<BillStatus, string> = {
      'OPEN': 'bg-warning',
      'PAID': 'bg-success',
      'VOID': 'bg-danger',
      'CANCELLED': 'bg-secondary',
      'CHARGED': 'bg-info'
    };
    return statusMap[status] || 'bg-secondary';
  }

  getAmount(bill: Bill): number {
    return typeof bill.amount === 'string' ? parseFloat(bill.amount) : (bill.amount || 0);
  }

  payBill(bill: Bill): void {
    if (!confirm(`Process payment for Bill #${bill.bill_id} (₹${this.getAmount(bill)})?`)) return;

    const idempotencyKey = `bill-${bill.bill_id}-${Date.now()}`;
    this.paymentService.createPayment(
      { bill_id: bill.bill_id, amount: this.getAmount(bill), method: 'CASH' },
      idempotencyKey
    ).subscribe({
      next: () => {
        bill.status = 'PAID';
        this.toastService.success(`Bill #${bill.bill_id} marked as PAID`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to process payment';
        this.toastService.error(msg);
      }
    });
  }

  voidBill(bill: Bill): void {
    if (!confirm(`Void Bill #${bill.bill_id}? This cannot be undone.`)) return;

    this.billingService.voidBill(bill.bill_id).subscribe({
      next: (updated) => {
        bill.status = updated.status;
        this.toastService.warning(`Bill #${bill.bill_id} has been voided`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to void bill';
        this.toastService.error(msg);
      }
    });
  }

  getPaidBillsCount(): number {
    return this.bills.filter(b => b.status === 'PAID').length;
  }

  getOpenBillsCount(): number {
    return this.bills.filter(b => b.status === 'OPEN').length;
  }

  getVoidBillsCount(): number {
    return this.bills.filter(b => b.status === 'VOID').length;
  }

  viewBillDetails(bill: Bill): void {
    const patientLabel = bill.patient_name || `Patient #${bill.patient_id}`;
    this.toastService.info(`Bill #${bill.bill_id} — ${patientLabel} — ₹${this.getAmount(bill)} — ${bill.status}`);
  }

  canProcessPayment(): boolean {
    return this.authService.hasRole(['admin', 'billing']);
  }
}
