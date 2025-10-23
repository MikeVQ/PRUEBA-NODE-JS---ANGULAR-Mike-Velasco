import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../núcleos/servicios/auth.service'; // 👈 OJO a la ruta y a la tilde en "núcleos"

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService) as AuthService; // 👈 tipamos para evitar "unknown"
  const t = auth.token();

  const url = req.url.toLowerCase();
  const skip =
    url.includes('/auth/login') ||
    url.includes('/password/recuperar') ||
    url.includes('/password/restablecer');

  if (t && !skip) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${t}` } });
  }
  return next(req);
};
