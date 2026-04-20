import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
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
  private mockDataService = inject(MockDataService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentStep = signal(1);
  totalSteps = 4;

  patients: Patient[] = [];
  departments: string[] = [];
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  availableSlots: string[] = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

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
    this.mockDataService.getPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.cdr.detectChanges();
      }
    });

    this.mockDataService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.cdr.detectChanges();
      }
    });

    this.mockDataService.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.cdr.detectChanges();
      }
    });

    this.doctorForm.get('department')?.valueChanges.subscribe(department => {
      if (department) {
        this.filteredDoctors = this.doctors.filter(d => d.department === department);
        this.doctorForm.patchValue({ doctor_id: '' });
        this.detailsForm.patchValue({ department });
      }
    });
  }

  nextStep(): void {
    const currentForm = this.getCurrentStepForm();
    if (currentForm && currentForm.valid) {
      this.currentStep.update(step => Math.min(step + 1, this.totalSteps));
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

    const selectedDate = this.dateTimeForm.value.appointment_date;
    const selectedTime = this.dateTimeForm.value.start_time;
    const [hours, minutes] = selectedTime.replace(' AM', '').replace(' PM', '').split(':');
    const isPM = selectedTime.includes('PM');
    const hour = isPM && hours !== '12' ? parseInt(hours) + 12 : parseInt(hours);
    
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, parseInt(minutes), 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    const appointmentData: Partial<Appointment> = {
      patient_id: Number(this.patientForm.value.patient_id),
      doctor_id: Number(this.doctorForm.value.doctor_id),
      department: this.detailsForm.value.department,
      slot_start: slotStart.toISOString(),
      slot_end: slotEnd.toISOString(),
      status: 'SCHEDULED',
      reschedule_count: 0
    };

    this.mockDataService.createAppointment(appointmentData).subscribe({
      next: (appointment) => {
        this.loading.set(false);
        alert(`✅ Appointment booked successfully!\nAppointment ID: #${appointment.appointment_id}`);
        this.router.navigate(['/appointments']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to book appointment. Please try again.');
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      this.router.navigate(['/appointments']);
    }
  }
}
