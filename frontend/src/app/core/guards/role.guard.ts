import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
}
