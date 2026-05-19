import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.currentUser()?.role;
  if (role === 'ADMIN' || role === 'HOTEL_MANAGER') {
    return true;
  }

  auth.logout();
  return router.createUrlTree(['/login']);
};
