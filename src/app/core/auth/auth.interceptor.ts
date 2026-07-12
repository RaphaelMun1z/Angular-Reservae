import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MonoTypeOperatorFunction, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthStore } from '../state/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!shouldAttachToken(request.url) || !authService.isAuthenticated()) {
    return next(request).pipe(handleAuthError(authStore, router));
  }

  return authService.getAccessToken().pipe(
    switchMap((token) => {
      const authorizedRequest = token
        ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : request;

      return next(authorizedRequest);
    }),
    catchError((error: unknown) => {
      authStore.clearSession('Sessao expirada. Entre novamente para continuar.');
      return throwError(() => error);
    }),
    handleAuthError(authStore, router),
  );
};

function shouldAttachToken(url: string): boolean {
  const requestUrl = new URL(url, window.location.origin);
  const apiUrl = new URL(environment.apiGatewayUrl);
  const keycloakUrl = new URL(environment.auth.keycloakUrl);

  return requestUrl.origin === apiUrl.origin && requestUrl.origin !== keycloakUrl.origin;
}

function handleAuthError(authStore: AuthStore, router: Router): MonoTypeOperatorFunction<HttpEvent<unknown>> {
  return catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        authStore.clearSession('Sessao expirada ou nao autorizada.');
      }

      if (error.status === 403) {
        void router.navigateByUrl('/403');
      }
    }

    return throwError(() => error);
  });
}
