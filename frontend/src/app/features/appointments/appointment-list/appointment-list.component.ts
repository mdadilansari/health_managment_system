import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PatientService } from '../../../core/services/patient.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  private patientMap = new Map<number, string>();
  private doctorMap = new Map<number, string>();
  
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading: boolean = true;
  error: string = '';
  
  selectedStatus: string = '';
  searchDate: string = '';
  searchTerm: string = '';
  
  currentUser = this.authService.currentUser;
  
  statusOptions: AppointmentStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    forkJoin({
      appointments: this.appointmentService.getAppointments(),
      patients: this.patientService.getPatients(),
      doctors: this.doctorService.getDoctors()
    }).subscribe({
      next: ({ appointments, patients, doctors }) => {
        patients.forEach(p => this.patientMap.set(p.patient_id, p.name));
        doctors.forEach(d => this.doctorMap.set(d.doctor_id, d.name));
        this.appointments = appointments.map(a => ({
          ...a,
          patient_name: this.patientMap.get(a.patient_id) || a.patient_name,
          doctor_name: this.doctorMap.get(a.doctor_id) || a.doctor_name,
        }));
        this.filteredAppointments = [...this.appointments];
        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.error = 'Failed to load appointments';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.appointments];
    
    if (this.selectedStatus) {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }
    
    if (this.searchDate) {
      filtered = filtered.filter(a => {
        const apptDate = new Date(a.slot_start).toISOString().split('T')[0];
        return apptDate === this.searchDate;
      });
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.patient_name?.toLowerCase().includes(term) ||
        a.doctor_name?.toLowerCase().includes(term) ||
        a.department?.toLowerCase().includes(term) ||
        a.appointment_id.toString().includes(term)
      );
    }
    
    this.filteredAppointments = filtered;
  }

  getStatusClass(status: AppointmentStatus): string {
    const statusMap: Record<AppointmentStatus, string> = {
      'SCHEDULED': 'bg-info',
      'COMPLETED': 'bg-success',
      'CANCELLED': 'bg-danger',
      'NO_SHOW': 'bg-warning'
    };
    return statusMap[status] || 'bg-secondary';
  }

  cancelAppointment(appointment: Appointment): void {
    if (!confirm(`Cancel appointment #${appointment.appointment_id}?`)) return;
    this.appointmentService.cancelAppointment(appointment.appointment_id!).subscribe({
      next: (updated) => {
        appointment.status = updated.status;
        this.toastService.success(`Appointment #${appointment.appointment_id} cancelled`);
        this.applyFilters();
        this.cdr.detectChanges();
        setTimeout(() => this.notificationService.loadNotifications(), 1000);
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to cancel appointment';
        this.toastService.error(msg);
      }
    });
  }

  completeAppointment(appointment: Appointment): void {
    if (!confirm(`Mark appointment #${appointment.appointment_id} as completed?`)) return;
    this.appointmentService.completeAppointment(appointment.appointment_id!).subscribe({
      next: (updated) => {
        appointment.status = updated.status;
        this.toastService.success(`Appointment #${appointment.appointment_id} marked as completed`);
        this.applyFilters();
        this.cdr.detectChanges();
        setTimeout(() => this.notificationService.loadNotifications(), 1000);
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to complete appointment';
        this.toastService.error(msg);
      }
    });
  }

  noShowAppointment(appointment: Appointment): void {
    if (!confirm(`Mark appointment #${appointment.appointment_id} as no-show?`)) return;
    this.appointmentService.noShowAppointment(appointment.appointment_id!).subscribe({
      next: (updated) => {
        appointment.status = updated.status;
        this.toastService.warning(`Appointment #${appointment.appointment_id} marked as no-show`);
        this.applyFilters();
        this.cdr.detectChanges();
        setTimeout(() => this.notificationService.loadNotifications(), 1000);
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to mark no-show';
        this.toastService.error(msg);
      }
    });
  }

  canBookAppointment(): boolean {
    return this.authService.hasRole(['admin', 'reception']);
  }

  canCancelAppointment(): boolean {
    return this.authService.hasRole(['admin', 'reception']);
  }

  canCompleteOrNoShow(): boolean {
    return this.authService.hasRole(['admin', 'doctor']);
  }
}
