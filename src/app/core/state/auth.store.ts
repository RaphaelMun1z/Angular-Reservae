import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
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
  readonly isOrganizer = computed(() => false);
  readonly canValidateTickets = computed(() => this.isAdmin());

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
        this._error.set(this.errorMessage(error, 'Nao foi possivel inicializar a autenticacao.'));
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
          this._error.set(this.errorMessage(error, 'Nao foi possivel atualizar a sessao.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  login(targetUrl = window.location.href): void {
    if (!this.integration) {
      this._error.set('Integracao de autenticacao nao configurada.');
      return;
    }

    const redirectUri = new URL(targetUrl, window.location.origin).toString();
    this._loading.set(true);
    this._error.set(null);

    this.integration
      .login(redirectUri)
      .pipe(
        tap((session) => this._session.set(this.normalizeSession(session))),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel entrar.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
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
          this._error.set(this.errorMessage(error, 'Nao foi possivel sair.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  updateMyProfile(request: UpdateUserProfileRequest): Observable<UserProfile | null> {
    if (!this.integration) {
      this._error.set('Integracao de perfil nao configurada.');
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
        this._error.set(this.errorMessage(error, 'Nao foi possivel atualizar o perfil.'));
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

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}

