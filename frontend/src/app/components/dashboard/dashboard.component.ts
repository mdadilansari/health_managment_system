import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { BillingService } from '../../core/services/billing.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import { UserRole } from '../../core/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);
  private billingService = inject(BillingService);
  private prescriptionService = inject(PrescriptionService);
  private cdr = inject(ChangeDetectorRef);
  
  currentUser = this.authService.currentUser;
  today = new Date();
  isLoading = true;
  
  stats = {
    patients: 0,
    doctors: 0,
    appointments: 0,
    bills: 0,
    prescriptions: 0
  };
  
  allCards = [
    {
      title: 'Patients',
      description: 'View and manage patient records',
      icon: '👥',
      count: '60 Patients',
      route: '/patients',
      color: 'primary',
      allowedRoles: ['admin', 'reception', 'doctor', 'billing'] as UserRole[]
    },
    {
      title: 'Doctors',
      description: 'Browse medical staff by department',
      icon: '👨‍⚕️',
      count: '25 Doctors',
      route: '/doctors',
      color: 'success',
      allowedRoles: ['admin', 'reception', 'doctor'] as UserRole[]
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage appointments',
      icon: '📅',
      count: '50 Scheduled',
      route: '/appointments',
      color: 'info',
      disabled: false,
      allowedRoles: ['admin', 'reception', 'doctor', 'billing'] as UserRole[]
    },
    {
      title: 'Billing',
      description: 'View bills and payment records',
      icon: '💰',
      count: '30 Bills',
      route: '/billing',
      color: 'warning',
      disabled: false,
      allowedRoles: ['admin', 'billing', 'reception'] as UserRole[]
    },
    {
      title: 'Prescriptions',
      description: 'Manage medical prescriptions',
      icon: '💊',
      count: '40 Active',
      route: '/prescriptions',
      color: 'secondary',
      disabled: false,
      allowedRoles: ['admin', 'doctor'] as UserRole[]
    }
  ];

  get cards() {
    const userRole = this.authService.getRole();
    if (!userRole) return [];
    
    return this.allCards.filter(card => 
      card.allowedRoles.includes(userRole)
    ).map(card => ({
      ...card,
      count: this.getCountForCard(card.title)
    }));
  }

  getCountForCard(title: string): string {
    switch (title) {
      case 'Patients':
        return `${this.stats.patients} Patients`;
      case 'Doctors':
        return `${this.stats.doctors} Doctors`;
      case 'Appointments':
        return `${this.stats.appointments} Scheduled`;
      case 'Billing':
        return `${this.stats.bills} Bills`;
      case 'Prescriptions':
        return `${this.stats.prescriptions} Active`;
      default:
        return '0';
    }
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    let loadedCount = 0;
    const totalServices = 5;

    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.stats.patients = patients.length;
        this.checkAllLoaded(++loadedCount, totalServices);
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.checkAllLoaded(++loadedCount, totalServices);
      }
    });
    
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.stats.doctors = doctors.length;
        this.checkAllLoaded(++loadedCount, totalServices);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.checkAllLoaded(++loadedCount, totalServices);
      }
    });
    
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.stats.appointments = appointments.length;
        this.checkAllLoaded(++loadedCount, totalServices);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.checkAllLoaded(++loadedCount, totalServices);
      }
    });
    
    this.billingService.getBills().subscribe({
      next: (bills) => {
        this.stats.bills = bills.length;
        this.checkAllLoaded(++loadedCount, totalServices);
      },
      error: (error) => {
        console.error('Error loading bills:', error);
        this.checkAllLoaded(++loadedCount, totalServices);
      }
    });

    this.prescriptionService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.stats.prescriptions = prescriptions.length;
        this.checkAllLoaded(++loadedCount, totalServices);
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.checkAllLoaded(++loadedCount, totalServices);
      }
    });
  }

  private checkAllLoaded(loaded: number, total: number): void {
    this.cdr.detectChanges();
    if (loaded === total) {
      this.isLoading = false;
    }
  }
}
