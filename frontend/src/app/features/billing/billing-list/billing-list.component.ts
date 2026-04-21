import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { Bill, BillStatus } from '../../../core/models/billing.model';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-list.component.html',
  styleUrls: ['./billing-list.component.css']
})
export class BillingListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  loading: boolean = true;
  error: string = '';
  
  selectedStatus: string = '';
  searchTerm: string = '';
  statusOptions: BillStatus[] = ['OPEN', 'PAID', 'VOID'];

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    this.mockDataService.getBills().subscribe({
      next: (data) => {
        this.bills = [...data];
        this.filteredBills = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
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
      'VOID': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
  }

  calculateTotal(bill: Bill): number {
    if (bill.line_items && bill.line_items.length > 0) {
      return bill.line_items.reduce((sum, item) => sum + item.amount, 0);
    }
    return bill.amount;
  }

  getPaidBillsCount(): number {
    return this.bills.filter(b => b.status === 'PAID').length;
  }

  getPendingBillsCount(): number {
    return this.bills.filter(b => b.status === 'OPEN').length;
  }

  getOverdueBillsCount(): number {
    return this.bills.filter(b => b.status === 'VOID').length;
  }

  viewBillDetails(bill: Bill): void {
    const items = bill.line_items && bill.line_items.length > 0 
      ? bill.line_items.map(item => `${item.description}: ₹${item.amount}`).join(', ')
      : 'No line items';
    this.toastService.info(`Bill #${bill.bill_id} - ${bill.patient_name || 'Patient #' + bill.patient_id} - Total: ₹${this.calculateTotal(bill)} - Status: ${bill.status}`);
  }
}
