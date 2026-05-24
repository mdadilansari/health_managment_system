import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Patient } from '../../core/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  patients: Patient[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string = '';
  saving: boolean = false;

  // Modal state
  showModal: boolean = false;
  editingPatient: Patient | null = null;
  patientForm: FormGroup;

  constructor() {
    this.patientForm = this.fb.group({
      name:  ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      dob:   ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  canManage(): boolean {
    return this.authService.hasRole(['admin', 'reception']);
  }

  loadPatients(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    this.patientService.getPatients().subscribe({
      next: (data) => {
        this.patients = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.error = 'Failed to load patients';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal(): void {
    this.editingPatient = null;
    this.patientForm.reset();
    this.showModal = true;
  }

  openEditModal(patient: Patient): void {
    this.editingPatient = patient;
    this.patientForm.patchValue({
      name:  patient.name,
      email: patient.email,
      phone: patient.phone,
      dob:   patient.dob ? patient.dob.split('T')[0] : '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingPatient = null;
    this.patientForm.reset();
  }

  savePatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const data = this.patientForm.value;

    const obs = this.editingPatient
      ? this.patientService.updatePatient(this.editingPatient.patient_id, data)
      : this.patientService.createPatient(data);

    obs.subscribe({
      next: (result) => {
        this.saving = false;
        if (this.editingPatient) {
          const idx = this.patients.findIndex(p => p.patient_id === this.editingPatient!.patient_id);
          if (idx > -1) this.patients[idx] = result;
          this.patients = [...this.patients];
          this.toastService.success(`Patient "${result.name}" updated successfully`);
        } else {
          this.patients = [result, ...this.patients];
          this.toastService.success(`Patient "${result.name}" added successfully`);
        }
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err?.error?.error || 'Failed to save patient');
        this.cdr.detectChanges();
      }
    });
  }

  deletePatient(patient: Patient): void {
    if (!confirm(`Delete patient "${patient.name}"? This cannot be undone.`)) return;

    this.patientService.deletePatient(patient.patient_id).subscribe({
      next: () => {
        this.patients = this.patients.filter(p => p.patient_id !== patient.patient_id);
        this.toastService.success(`Patient "${patient.name}" deleted`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error(err?.error?.error || 'Failed to delete patient');
      }
    });
  }

  get filteredPatients(): Patient[] {
    if (!this.searchTerm) return this.patients;
    const term = this.searchTerm.toLowerCase();
    return this.patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.patient_id.toString().includes(term)
    );
  }
}
