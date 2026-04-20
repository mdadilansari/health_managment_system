import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
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
  private cdr = inject(ChangeDetectorRef);
  
  prescriptions: Prescription[] = [];
  loading: boolean = true;
  error: string = '';
  
  searchPatientId: string = '';

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
    if (!this.searchPatientId) {
      return this.prescriptions;
    }
    return this.prescriptions.filter(p => 
      p.patient_id.toString().includes(this.searchPatientId)
    );
  }

  viewPrescription(prescription: Prescription): void {
    const details = `
Prescription Details:
━━━━━━━━━━━━━━━━━━━━
Prescription ID: #${prescription.prescription_id}
Patient: ${prescription.patient_name || 'Patient #' + prescription.patient_id}
Doctor: ${prescription.doctor_name || 'Doctor #' + prescription.doctor_id}
Date: ${new Date(prescription.issued_at).toLocaleDateString()}

Medication: ${prescription.medication}
Dosage: ${prescription.dosage}
Duration: ${prescription.days} days
    `;
    alert(details);
  }

  printPrescription(prescription: Prescription): void {
    alert(`🖨️ Print functionality will open a print-friendly view for Prescription #${prescription.prescription_id}`);
  }
}
