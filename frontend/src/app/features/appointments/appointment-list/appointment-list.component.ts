import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
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
    
    this.mockDataService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = [...data];
        this.filteredAppointments = [...data];
        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
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
    // In real app, this would call a backend API
    appointment.status = 'CANCELLED';
    this.toastService.success(`Appointment #${appointment.appointment_id} has been cancelled`);
    this.cdr.detectChanges();
  }
}
