import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { ToastService } from '../../../core/services/toast.service';
import { PatientService } from '../../../core/services/patient.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { AuthService } from '../../../core/services/auth.service';
import { Prescription } from '../../../core/models/prescription.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css']
})
export class PrescriptionListComponent implements OnInit {
  private prescriptionService = inject(PrescriptionService);
  private toastService = inject(ToastService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  canWrite(): boolean {
    return this.authService.hasRole(['admin', 'doctor']);
  }
  
  private patientMap = new Map<number, string>();
  private doctorMap = new Map<number, string>();
  
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

    forkJoin({
      prescriptions: this.prescriptionService.getPrescriptions(),
      patients: this.patientService.getPatients(),
      doctors: this.doctorService.getDoctors()
    }).subscribe({
      next: ({ prescriptions, patients, doctors }) => {
        patients.forEach(p => this.patientMap.set(p.patient_id, p.name));
        doctors.forEach(d => this.doctorMap.set(d.doctor_id, d.name));
        this.prescriptions = prescriptions.map(p => ({
          ...p,
          patient_name: this.patientMap.get(p.patient_id) || p.patient_name,
          doctor_name: this.doctorMap.get(p.doctor_id) || p.doctor_name,
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
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
