import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../../core/services/billing.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bill, BillStatus } from '../../../core/models/billing.model';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-list.component.html',
  styleUrls: ['./billing-list.component.css']
})
export class BillingListComponent implements OnInit {
  private billingService = inject(BillingService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  loading: boolean = true;
  error: string = '';
  
  selectedStatus: string = '';
  searchTerm: string = '';
  statusOptions: BillStatus[] = ['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'];

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    this.billingService.getBills().subscribe({
      next: (data) => {
        this.bills = [...data];
        this.filteredBills = [...data];
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
      'PENDING': 'bg-warning',
      'PAID': 'bg-success',
      'PARTIALLY_PAID': 'bg-info',
      'OVERDUE': 'bg-danger',
      'OPEN': 'bg-warning',
      'VOID': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
  }

  calculateTotal(bill: Bill): number {
    if (bill.line_items && bill.line_items.length > 0) {
      return bill.line_items.reduce((sum, item) => sum + item.amount, 0);
    }
    return typeof bill.amount === 'string' ? parseFloat(bill.amount) : (bill.amount || 0);
  }

  getPaidBillsCount(): number {
    return this.bills.filter(b => b.status === 'PAID').length;
  }

  getPendingBillsCount(): number {
    return this.bills.filter(b => b.status === 'PENDING').length;
  }

  getOverdueBillsCount(): number {
    return this.bills.filter(b => b.status === 'OVERDUE').length;
  }

  getOpenBillsCount(): number {
    return this.bills.filter(b => b.status === 'OPEN').length;
  }

  getVoidBillsCount(): number {
    return this.bills.filter(b => b.status === 'VOID').length;
  }

  viewBillDetails(bill: Bill): void {
    const items = bill.line_items && bill.line_items.length > 0 
      ? bill.line_items.map(item => `${item.description}: ₹${item.amount}`).join(', ')
      : 'No line items';
    this.toastService.info(`Bill #${bill.bill_id} - ${bill.patient_name || 'Patient #' + bill.patient_id} - Total: ₹${this.calculateTotal(bill)} - Status: ${bill.status}`);
  }

  canProcessPayment(): boolean {
    return this.authService.hasRole(['admin', 'billing']);
  }
}
