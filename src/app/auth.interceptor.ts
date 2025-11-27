// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  // Clonar la petición con headers necesarios
  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  } else {
    clonedReq = req.clone({
      setHeaders: {
        Accept: 'application/json'
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el token expiró o es inválido (401), redirigir al login
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
