import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
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
  private mockDataService = inject(MockDataService);
  
  currentUser = this.authService.currentUser;
  today = new Date();
  
    stats = {
    patients: 0,
    doctors: 0,
    appointments: 0,
    bills: 0
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
    );
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.mockDataService.getPatients().subscribe(p => this.stats.patients = p.length);
    this.mockDataService.getDoctors().subscribe(d => this.stats.doctors = d.length);
    this.mockDataService.getAppointments().subscribe(a => this.stats.appointments = a.length);
    this.mockDataService.getBills().subscribe(b => this.stats.bills = b.length);
  }
}
