import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAdmin = auth.isLoggedIn() && auth.rol() === 'ADMIN';

  if (!isAdmin) {
    console.warn('[adminGuard] acceso denegado. rol:', auth.rol());
    router.navigateByUrl('/inicio');
    return false;
  }
  return true;
};
