import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

export interface AuthSession {
  readonly authenticated: boolean;
  readonly userId: string | null;
  readonly username: string | null;
  readonly email?: string | null;
  readonly roles: readonly string[];
}

export interface AuthIntegration {
  currentSession(): Observable<AuthSession>;
  login(): Observable<AuthSession>;
  logout(): Observable<void>;
}

export const AUTH_INTEGRATION = new InjectionToken<AuthIntegration>('AUTH_INTEGRATION');

const emptySession: AuthSession = {
  authenticated: false,
  userId: null,
  username: null,
  email: null,
  roles: [],
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

  readonly authenticated = computed(() => this._session().authenticated);
  readonly userId = computed(() => this._session().userId);
  readonly username = computed(() => this._session().username);
  readonly email = computed(() => this._session().email ?? null);
  readonly roles = computed(() => this._session().roles);
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly isOrganizer = computed(() => this.hasRole('ORGANIZER'));
  readonly canValidateTickets = computed(
    () => this.isAdmin() || this.isOrganizer() || this.hasRole('TICKET_VALIDATOR'),
  );

  refreshSession(): void {
    if (!this.integration) {
      this._session.set(emptySession);
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.integration
      .currentSession()
      .pipe(
        tap((session) => this._session.set(this.normalizeSession(session))),
        catchError((error: unknown) => {
          this._session.set(emptySession);
          this._error.set(this.errorMessage(error, 'Nao foi possivel atualizar a sessao.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  login(): void {
    if (!this.integration) {
      this._error.set('Integracao de autenticacao nao configurada.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.integration
      .login()
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
      this._session.set(emptySession);
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.integration
      .logout()
      .pipe(
        tap(() => this._session.set(emptySession)),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel sair.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  updateSession(session: AuthSession): void {
    this._session.set(this.normalizeSession(session));
    this._error.set(null);
  }

  clearSession(): void {
    this._session.set(emptySession);
    this._error.set(null);
  }

  private hasRole(role: string): boolean {
    return this._session().roles.includes(role);
  }

  private normalizeSession(session: AuthSession): AuthSession {
    return {
      authenticated: session.authenticated,
      userId: session.userId,
      username: session.username,
      email: session.email ?? null,
      roles: [...session.roles],
    };
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
