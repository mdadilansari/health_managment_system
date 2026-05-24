import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
        canActivate: [roleGuard(['admin', 'reception', 'doctor', 'billing'])],
        loadComponent: () => import('./components/patient-list/patient-list.component').then(m => m.PatientListComponent)
      },
      {
        path: 'doctors',
        canActivate: [roleGuard(['admin', 'reception', 'doctor'])],
        loadComponent: () => import('./components/doctor-list/doctor-list.component').then(m => m.DoctorListComponent)
      },
      {
        path: 'appointments',
        canActivate: [roleGuard(['admin', 'reception', 'doctor', 'billing'])],
        loadComponent: () => import('./features/appointments/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent)
      },
      {
        path: 'appointments/book',
        canActivate: [roleGuard(['admin', 'reception'])],
        loadComponent: () => import('./features/appointments/appointment-book/appointment-book.component').then(m => m.AppointmentBookComponent)
      },
      {
        path: 'billing',
        canActivate: [roleGuard(['admin', 'billing', 'reception'])],
        loadComponent: () => import('./features/billing/billing-list/billing-list.component').then(m => m.BillingListComponent)
      },
      {
        path: 'prescriptions',
        canActivate: [roleGuard(['admin', 'doctor'])],
        loadComponent: () => import('./features/prescriptions/prescription-list/prescription-list.component').then(m => m.PrescriptionListComponent)
      },
      {
        path: 'prescriptions/write',
        canActivate: [roleGuard(['admin', 'doctor'])],
        loadComponent: () => import('./features/prescriptions/prescription-create/prescription-create.component').then(m => m.PrescriptionCreateComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
