import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { MonoTypeOperatorFunction, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthStore } from '../state/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const environmentInjector = inject(EnvironmentInjector);

  if (!shouldAttachToken(request.url) || !authService.isAuthenticated()) {
    return next(request).pipe(handleAuthError(authStore, environmentInjector, request.url));
  }

  return authService.getAccessToken().pipe(
    switchMap((token) => {
      const authorizedRequest = token
        ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : request;

      return next(authorizedRequest);
    }),
    catchError((error: unknown) => {
      if (!isProfileRequest(request.url) && isAuthenticationFailure(error)) {
        authStore.clearSession('Sua sessao expirou. Entre novamente para continuar.');
      }
      return throwError(() => error);
    }),
    handleAuthError(authStore, environmentInjector, request.url),
  );
};

function shouldAttachToken(url: string): boolean {
  const requestUrl = new URL(url, window.location.origin);
  const apiUrl = new URL(environment.apiGatewayUrl);
  const keycloakUrl = new URL(environment.auth.keycloakUrl);

  return requestUrl.origin === apiUrl.origin && requestUrl.origin !== keycloakUrl.origin;
}

function isAuthenticationFailure(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 401;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /invalid_grant|invalid[_ -]?token|token[^.]{0,40}(expired|expirado|not active)|login_required/i.test(error.message);
}

function handleAuthError(authStore: AuthStore, environmentInjector: EnvironmentInjector, requestUrl: string): MonoTypeOperatorFunction<HttpEvent<unknown>> {
  return catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        if (!isProfileRequest(requestUrl)) {
          authStore.clearSession('Sua sessao expirou. Entre novamente para continuar.');
        }
      }

      if (error.status === 403) {
        if (!isProfileRequest(requestUrl)) {
          runInInjectionContext(environmentInjector, () => {
            void inject(Router).navigateByUrl('/403');
          });
        }
      }
    }

    return throwError(() => error);
  });
}

function isProfileRequest(url: string): boolean {
  return url.includes('/user-profile-service/api/profiles/v1/me');
}
