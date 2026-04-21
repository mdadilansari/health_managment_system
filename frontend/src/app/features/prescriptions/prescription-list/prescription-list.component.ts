import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { Prescription } from '../../../core/models/prescription.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css']
})
export class PrescriptionListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  
  prescriptions: Prescription[] = [];
  loading: boolean = true;
  error: string = '';
  
  searchTerm: string = '';

  ngOnInit(): void {
    this.loadPrescriptions();
  }

  loadPrescriptions(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    this.mockDataService.getPrescriptions().subscribe({
      next: (data) => {
        this.prescriptions = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load prescriptions';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredPrescriptions(): Prescription[] {
    if (!this.searchTerm) {
      return this.prescriptions;
    }
    const term = this.searchTerm.toLowerCase();
    return this.prescriptions.filter(p => 
      p.patient_id.toString().includes(term) ||
      p.patient_name?.toLowerCase().includes(term) ||
      p.doctor_name?.toLowerCase().includes(term) ||
      p.medication.toLowerCase().includes(term) ||
      p.prescription_id.toString().includes(term)
    );
  }

  viewPrescription(prescription: Prescription): void {
    this.toastService.info(`Prescription #${prescription.prescription_id} - ${prescription.medication} (${prescription.dosage}) - ${prescription.days} days for ${prescription.patient_name || 'Patient #' + prescription.patient_id}`);
  }

  printPrescription(prescription: Prescription): void {
    this.toastService.success(`🖨️ Print view opened for Prescription #${prescription.prescription_id}`);
  }
}
