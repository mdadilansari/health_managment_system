import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';

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
  
  cards = [
    {
      title: 'Patients',
      description: 'View and manage patient records',
      icon: '👥',
      count: '60 Patients',
      route: '/patients',
      color: 'primary'
    },
    {
      title: 'Doctors',
      description: 'Browse medical staff by department',
      icon: '👨‍⚕️',
      count: '25 Doctors',
      route: '/doctors',
      color: 'success'
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage appointments',
      icon: '📅',
      count: 'Coming Soon',
      route: '#',
      color: 'info',
      disabled: true
    },
    {
      title: 'Billing',
      description: 'View bills and payment records',
      icon: '💰',
      count: 'Coming Soon',
      route: '#',
      color: 'warning',
      disabled: true
    }
  ];

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
