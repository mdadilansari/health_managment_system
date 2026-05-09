import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ToastService } from '../../../core/services/toast.service';
import { Patient } from '../../../core/models/patient.model';
import { Doctor } from '../../../core/models/doctor.model';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-book.component.html',
  styleUrls: ['./appointment-book.component.css']
})
export class AppointmentBookComponent implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  currentStep = signal(1);
  totalSteps = 4;

  patients: Patient[] = [];
  departments: string[] = [];
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  availableSlots: string[] = [];

  patientForm: FormGroup;
  doctorForm: FormGroup;
  dateTimeForm: FormGroup;
  detailsForm: FormGroup;

  loading = signal(false);
  error = signal('');

  constructor() {
    this.patientForm = this.fb.group({
      patient_id: ['', Validators.required]
    });

    this.doctorForm = this.fb.group({
      department: ['', Validators.required],
      doctor_id: ['', Validators.required]
    });

    this.dateTimeForm = this.fb.group({
      appointment_date: ['', Validators.required],
      start_time: ['', Validators.required]
    });

    this.detailsForm = this.fb.group({
      department: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.patientService.getPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading patients:', err)
    });

    this.doctorService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading departments:', err)
    });

    this.doctorService.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading doctors:', err)
    });

    this.doctorForm.get('department')?.valueChanges.subscribe(department => {
      if (department) {
        this.filteredDoctors = this.doctors.filter(d => d.department === department);
        this.doctorForm.patchValue({ doctor_id: '' });
        this.detailsForm.patchValue({ department });
      }
    });

    // Load available slots when doctor is selected
    this.doctorForm.get('doctor_id')?.valueChanges.subscribe(doctorId => {
      const date = this.dateTimeForm.get('appointment_date')?.value;
      if (doctorId && date) {
        this.loadAvailableSlots(doctorId, date);
      } else {
        this.availableSlots = [];
        this.dateTimeForm.patchValue({ start_time: '' });
      }
    });

    // Load available slots when date changes
    this.dateTimeForm.get('appointment_date')?.valueChanges.subscribe(date => {
      const doctorId = this.doctorForm.get('doctor_id')?.value;
      if (date && doctorId) {
        this.loadAvailableSlots(doctorId, date);
      } else {
        this.availableSlots = [];
        this.dateTimeForm.patchValue({ start_time: '' });
      }
    });
  }

  loadAvailableSlots(doctorId: number, date: string): void {
    this.appointmentService.getAvailableSlots(doctorId, date).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        this.availableSlots = [];
      }
    });
  }

  nextStep(): void {
    const currentForm = this.getCurrentStepForm();
    if (currentForm && currentForm.valid) {
      this.currentStep.update(step => Math.min(step + 1, this.totalSteps));
      // When entering step 3, reload slots if doctor and date are already set
      if (this.currentStep() === 3) {
        const doctorId = this.doctorForm.get('doctor_id')?.value;
        const date = this.dateTimeForm.get('appointment_date')?.value;
        if (doctorId && date) {
          this.loadAvailableSlots(doctorId, date);
        }
      }
    } else {
      currentForm?.markAllAsTouched();
    }
  }

  previousStep(): void {
    this.currentStep.update(step => Math.max(step - 1, 1));
  }

  getCurrentStepForm(): FormGroup | null {
    switch (this.currentStep()) {
      case 1: return this.patientForm;
      case 2: return this.doctorForm;
      case 3: return this.dateTimeForm;
      case 4: return this.detailsForm;
      default: return null;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.patientForm.valid;
      case 2: return this.doctorForm.valid;
      case 3: return this.dateTimeForm.valid;
      case 4: return this.detailsForm.valid;
      default: return false;
    }
  }

  getSelectedPatient(): Patient | undefined {
    const patientId = this.patientForm.get('patient_id')?.value;
    return this.patients.find(p => p.patient_id === Number(patientId));
  }

  getSelectedDoctor(): Doctor | undefined {
    const doctorId = this.doctorForm.get('doctor_id')?.value;
    return this.doctors.find(d => d.doctor_id === Number(doctorId));
  }

  bookAppointment(): void {
    if (!this.isStepValid(1) || !this.isStepValid(2) || !this.isStepValid(3) || !this.isStepValid(4)) {
      this.error.set('Please complete all steps correctly');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const appointmentData = {
      patient_id: Number(this.patientForm.value.patient_id),
      doctor_id: Number(this.doctorForm.value.doctor_id),
      department: this.doctorForm.value.department,
      appointment_date: this.dateTimeForm.value.appointment_date,
      start_time: this.dateTimeForm.value.start_time
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (appointment) => {
        this.loading.set(false);
        this.toastService.success(`Appointment booked successfully! Appointment ID: #${appointment.appointment_id}`);
        this.router.navigate(['/appointments']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to book appointment. Please try again.');
        this.toastService.error('Failed to book appointment. Please try again.');
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      this.router.navigate(['/appointments']);
    }
  }
}
