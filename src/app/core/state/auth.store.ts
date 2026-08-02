import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AuthSession, ReservaeRole, UpdateUserProfileRequest, UserProfile } from '../auth/auth.models';

export type { AuthSession, ReservaeRole, UpdateUserProfileRequest, UserProfile };

export interface AuthIntegration {
  initialize(): Observable<AuthSession>;
  currentSession(): Observable<AuthSession>;
  login(redirectUri?: string): Observable<AuthSession>;
  logout(redirectUri?: string): Observable<void>;
  updateMyProfile(request: UpdateUserProfileRequest): Observable<UserProfile>;
}

export const AUTH_INTEGRATION = new InjectionToken<AuthIntegration>('AUTH_INTEGRATION');

const emptySession: AuthSession = {
  initialized: false,
  authenticated: false,
  userId: null,
  username: null,
  fullName: null,
  email: null,
  roles: [],
  profile: null,
};

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly integration = inject(AUTH_INTEGRATION, { optional: true });
  private readonly router = inject(Router);

  private readonly _session = signal<AuthSession>(emptySession);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly initialized = computed(() => this._session().initialized);
  readonly authenticated = computed(() => this._session().authenticated);
  readonly isAuthenticated = this.authenticated;
  readonly userId = computed(() => this._session().userId);
  readonly username = computed(() => this._session().username);
  readonly fullName = computed(() => this._session().fullName);
  readonly email = computed(() => this._session().email);
  readonly roles = computed(() => this._session().roles);
  readonly profile = computed(() => this._session().profile);
  readonly displayName = computed(
    () => this.profile()?.fullName || this.fullName() || this.username() || this.email() || 'Conta Reservae',
  );
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly isCustomer = computed(() => this.hasRole('CUSTOMER'));
  readonly isOrganizer = computed(() => this.hasRole('ORGANIZER'));
  readonly isSupport = computed(() => this.hasRole('SUPPORT'));
  readonly canAccessDashboard = computed(() => this.isAdmin() || this.isOrganizer() || this.isSupport());
  readonly canValidateTickets = computed(() => this.isAdmin() || this.isSupport());
  readonly accessRole = computed<ReservaeRole | null>(() => {
    const roles = this.roles();
    return (['ADMIN', 'ORGANIZER', 'SUPPORT', 'CUSTOMER'] as const).find((role) => roles.includes(role)) ?? null;
  });

  initialize(): Observable<AuthSession | null> {
    if (!this.integration) {
      this._session.set({ ...emptySession, initialized: true });
      return of(this._session());
    }

    this._loading.set(true);
    this._error.set(null);

    return this.integration.initialize().pipe(
      tap((session) => this._session.set(this.normalizeSession(session))),
      catchError((error: unknown) => {
        this._session.set({ ...emptySession, initialized: true });
        this._error.set(this.errorMessage(error, 'Nao foi possivel iniciar sua sessao. Tente novamente.'));
        return of(null);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  refreshSession(): void {
    if (!this.integration) {
      this._session.set({ ...emptySession, initialized: true });
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.integration
      .currentSession()
      .pipe(
        tap((session) => this._session.set(this.normalizeSession(session))),
        catchError((error: unknown) => {
          this._session.set({ ...emptySession, initialized: true });
          this._error.set(this.errorMessage(error, 'Nao foi possivel carregar seus dados. Tente novamente.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  login(targetUrl = window.location.href): void {
    if (!this.integration) {
      this._error.set('Nao foi possivel iniciar o login agora. Tente novamente.');
      return;
    }

    const redirectUri = new URL(targetUrl, window.location.origin).toString();
    this._loading.set(true);
    this._error.set(null);

    this.integration
      .login(redirectUri)
      .pipe(
        tap((session) => {
          const normalizedSession = this.normalizeSession(session);
          this._session.set(normalizedSession);

          if (this.isOrganizerOnly(normalizedSession)) {
            void this.router.navigateByUrl('/organizer/management/events');
          } else if (redirectUri === window.location.href || redirectUri.endsWith('/login')) {
            void this.router.navigateByUrl('/inicio');
          }
        }),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel concluir o login. Tente novamente.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  loginMock(email: string, password: string): boolean {
    const mockUsers: Record<string, { password: string; role: ReservaeRole; name: string }> = {
      'admin@reservae.com': { password: 'admin', role: 'ADMIN', name: 'Administrador Reservae' },
      'organizer@reservae.com': { password: 'organizer', role: 'ORGANIZER', name: 'Organizador Reservae' },
      'support@reservae.com': { password: 'support', role: 'SUPPORT', name: 'Suporte Reservae' },
      'customer@reservae.com': { password: 'customer', role: 'CUSTOMER', name: 'Cliente Reservae' },
    };
    const user = mockUsers[email.toLowerCase()];

    if (!user || user.password !== password) {
      this._error.set('E-mail ou senha invalidos. Verifique os dados e tente novamente.');
      return false;
    }

    this.updateSession({
      initialized: true,
      authenticated: true,
      userId: `mock-${user.role.toLowerCase()}`,
      username: email,
      fullName: user.name,
      email,
      roles: [user.role],
      profile: {
        id: `mock-${user.role.toLowerCase()}`,
        fullName: user.name,
        email,
        document: null,
      },
    });
    return true;
  }

  logout(): void {
    if (!this.integration) {
      this._session.set({ ...emptySession, initialized: true });
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.integration
      .logout(window.location.origin)
      .pipe(
        tap(() => this._session.set({ ...emptySession, initialized: true })),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel encerrar sua sessao. Tente novamente.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  updateMyProfile(request: UpdateUserProfileRequest): Observable<UserProfile | null> {
    if (!this.integration) {
      this._error.set('Nao foi possivel atualizar seus dados agora. Tente novamente.');
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.integration.updateMyProfile(request).pipe(
      tap((profile) => {
        this._session.update((session) => ({
          ...session,
          fullName: profile.fullName ?? session.fullName,
          email: profile.email ?? session.email,
          profile,
        }));
      }),
      catchError((error: unknown) => {
        this._error.set(this.errorMessage(error, 'Nao foi possivel atualizar seus dados. Tente novamente.'));
        return of(null);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  updateSession(session: AuthSession): void {
    this._session.set(this.normalizeSession(session));
    this._error.set(null);
  }

  clearSession(error: string | null = null): void {
    this._session.set({ ...emptySession, initialized: true });
    this._error.set(error);
  }

  hasRole(role: string): boolean {
    const normalizedRole = role.toUpperCase();
    return this._session().roles.includes(normalizedRole as ReservaeRole);
  }

  private normalizeSession(session: AuthSession): AuthSession {
    return {
      initialized: session.initialized,
      authenticated: session.authenticated,
      userId: session.userId,
      username: session.username,
      fullName: session.fullName,
      email: session.email,
      roles: [...session.roles],
      profile: session.profile ? { ...session.profile } : null,
    };
  }

  private isOrganizerOnly(session: AuthSession): boolean {
    return session.roles.includes('ORGANIZER') && !session.roles.includes('ADMIN');
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = this.apiErrorMessage(error.error);
      return apiMessage ? `${fallback} ${apiMessage}` : fallback;
    }

    if (error instanceof Error && error.message) {
      return this.isTechnicalMessage(error.message) ? fallback : `${fallback} ${error.message}`;
    }

    return fallback;
  }

  private apiErrorMessage(body: unknown): string | null {
    if (typeof body === 'string' && body.trim()) {
      const message = body.trim();
      return this.isTechnicalMessage(message) ? null : message;
    }

    if (!body || typeof body !== 'object') {
      return null;
    }

    const response = body as { message?: unknown; detail?: unknown; error?: unknown; errors?: unknown };
    const directMessage = [response.message, response.detail, response.error].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );

    if (directMessage) {
      return directMessage.trim();
    }

    if (Array.isArray(response.errors)) {
      const messages = response.errors
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && typeof item === 'object' && 'message' in item && typeof item.message === 'string') {
            return item.message;
          }

          return null;
        })
        .filter((message): message is string => Boolean(message));

      return messages.length > 0 ? messages.join(' ') : null;
    }

    const fieldMessages = Object.values(response)
      .flatMap((value) => {
        if (typeof value === 'string' && value.trim()) {
          return [value.trim()];
        }

        if (Array.isArray(value)) {
          return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }

        return [];
      });

    return fieldMessages.length > 0 ? fieldMessages.join(' ') : null;
  }

  private isTechnicalMessage(message: string): boolean {
    return /erro inesperado no servidor|uri=\/|timestamp\s*[:=]/i.test(message);
  }
}
