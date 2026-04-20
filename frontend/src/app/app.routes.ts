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
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
