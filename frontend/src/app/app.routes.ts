import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: '', 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'patients',
        loadComponent: () => import('./components/patient-list/patient-list.component').then(m => m.PatientListComponent)
      },
      {
        path: 'doctors',
        loadComponent: () => import('./components/doctor-list/doctor-list.component').then(m => m.DoctorListComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/appointments/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent)
      },
      {
        path: 'appointments/book',
        loadComponent: () => import('./features/appointments/appointment-book/appointment-book.component').then(m => m.AppointmentBookComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/billing-list/billing-list.component').then(m => m.BillingListComponent)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./features/prescriptions/prescription-list/prescription-list.component').then(m => m.PrescriptionListComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
