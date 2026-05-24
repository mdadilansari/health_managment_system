import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-prescription-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './prescription-create.component.html'
})
export class PrescriptionCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private prescriptionService = inject(PrescriptionService);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  form: FormGroup;
  appointments: any[] = [];
  loading = false;
  dataLoading = false;
  error = '';

  patientMap: Record<number, string> = {};
  doctorMap: Record<number, string> = {};

  constructor() {
    this.form = this.fb.group({
      appointment_id: ['', Validators.required],
      patient_id: ['', Validators.required],
      doctor_id: ['', Validators.required],
      medication: ['', [Validators.required, Validators.maxLength(100)]],
      dosage: ['', [Validators.required, Validators.maxLength(20)]],
      days: ['', [Validators.required, Validators.min(1), Validators.max(365)]]
    });
  }

  ngOnInit(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (appointments: any[]) => {
        this.appointments = appointments.filter(
          a => a.status === 'SCHEDULED' || a.status === 'COMPLETED'
        );
      }
    });

    this.patientService.getPatients().subscribe({
      next: (patients: any[]) => {
        patients.forEach((p: any) => this.patientMap[p.patient_id] = p.name);
      }
    });

    this.doctorService.getDoctors().subscribe({
      next: (doctors: any[]) => {
        doctors.forEach((d: any) => this.doctorMap[d.doctor_id] = d.name);
      }
    });
  }

  onAppointmentChange(): void {
    const apptId = Number(this.form.value.appointment_id);
    const appt = this.appointments.find(a => a.appointment_id === apptId);
    if (appt) {
      this.form.patchValue({
        patient_id: appt.patient_id,
        doctor_id: appt.doctor_id
      });
    }
  }

  getPatientName(id: number): string {
    return this.patientMap[id] || `Patient #${id}`;
  }

  getDoctorName(id: number): string {
    return this.doctorMap[id] || `Doctor #${id}`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      appointment_id: Number(this.form.value.appointment_id),
      patient_id: Number(this.form.value.patient_id),
      doctor_id: Number(this.form.value.doctor_id),
      medication: this.form.value.medication.trim(),
      dosage: this.form.value.dosage.trim(),
      days: Number(this.form.value.days)
    };

    this.prescriptionService.createPrescription(payload).subscribe({
      next: () => {
        this.toastService.success('Prescription written successfully!');
        this.loading = false;
        setTimeout(() => this.router.navigate(['/prescriptions']), 1500);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to create prescription. Please try again.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/prescriptions']);
  }
}
