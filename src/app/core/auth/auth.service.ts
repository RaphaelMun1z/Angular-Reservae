import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import { from, Observable, of, switchMap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiUrlService } from '../services/api-url.service';
import { AuthIntegration } from '../state/auth.store';
import { AuthSession, ReservaeRole, UpdateUserProfileRequest, UserProfile } from './auth.models';
import {
  keycloak,
  keycloakInitOptions,
  RESERVAE_FUNCTIONAL_ROLES,
} from './keycloak.config';

const PROFILE_PATH = '/user-profile-service/api/profiles/v1/me';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthIntegration {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly keycloak: Keycloak = keycloak;
  private initialized = false;

  initialize(): Observable<AuthSession> {
    if (this.initialized) {
      return this.currentSession();
    }

    return from(this.keycloak.init(keycloakInitOptions)).pipe(
      switchMap(() => {
        this.initialized = true;
        return this.currentSession();
      }),
      catchError((error: unknown) => {
        this.initialized = true;
        return throwError(() => this.toError(error, 'Nao foi possivel inicializar o Keycloak.'));
      }),
    );
  }

  currentSession(): Observable<AuthSession> {
    const authenticated = Boolean(this.keycloak.authenticated);

    if (!authenticated) {
      return of(this.emptySession(true));
    }

    return this.loadMyProfile().pipe(
      map((profile) => this.sessionFromToken(profile)),
      catchError(() => of(this.sessionFromToken(null))),
    );
  }

  login(redirectUri = window.location.href): Observable<AuthSession> {
    return from(this.keycloak.login({ redirectUri })).pipe(switchMap(() => this.currentSession()));
  }

  logout(redirectUri = window.location.origin): Observable<void> {
    return from(this.keycloak.logout({ redirectUri })).pipe(map(() => void 0));
  }

  updateToken(minValiditySeconds = 30): Observable<boolean> {
    if (!this.keycloak.authenticated) {
      return of(false);
    }

    return from(this.keycloak.updateToken(minValiditySeconds));
  }

  getAccessToken(): Observable<string | null> {
    if (!this.keycloak.authenticated) {
      return of(null);
    }

    return this.updateToken(30).pipe(map(() => this.keycloak.token ?? null));
  }

  isAuthenticated(): boolean {
    return Boolean(this.keycloak.authenticated);
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role.toUpperCase() as ReservaeRole);
  }

  getRoles(): readonly ReservaeRole[] {
    return this.normalizeRoles(this.keycloak.realmAccess?.roles ?? []);
  }

  loadMyProfile(): Observable<UserProfile> {
    return this.http
      .get<UserProfileResponse>(this.apiUrl.url(PROFILE_PATH))
      .pipe(map((profile) => this.normalizeProfile(profile)));
  }

  updateMyProfile(request: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http
      .patch<UserProfileResponse>(this.apiUrl.url(PROFILE_PATH), request)
      .pipe(map((profile) => this.normalizeProfile(profile)));
  }

  buildLoginRedirectUrl(url: string): string {
    return new URL(url, window.location.origin).toString();
  }

  private sessionFromToken(profile: UserProfile | null): AuthSession {
    const token = this.keycloak.tokenParsed;
    const email = this.readClaim(token, 'email') ?? profile?.email ?? null;
    const preferredUsername = this.readClaim(token, 'preferred_username');
    const name = this.readClaim(token, 'name') ?? profile?.fullName ?? null;

    return {
      initialized: this.initialized,
      authenticated: true,
      userId: token?.sub ?? profile?.id ?? null,
      username: preferredUsername ?? email ?? name,
      fullName: profile?.fullName ?? name,
      email,
      roles: this.getRoles(),
      profile,
    };
  }

  private emptySession(initialized: boolean): AuthSession {
    return {
      initialized,
      authenticated: false,
      userId: null,
      username: null,
      fullName: null,
      email: null,
      roles: [],
      profile: null,
    };
  }

  private normalizeRoles(roles: readonly string[]): readonly ReservaeRole[] {
    const functionalRoles = new Set<string>(RESERVAE_FUNCTIONAL_ROLES);

    return roles
      .map((role) => role.toUpperCase())
      .filter((role): role is ReservaeRole => functionalRoles.has(role));
  }

  private normalizeProfile(profile: UserProfileResponse): UserProfile {
    return {
      id: profile.id ?? null,
      fullName: profile.fullName ?? null,
      email: profile.email ?? null,
      document: profile.document ?? null,
    };
  }

  private readClaim(token: KeycloakTokenParsed | undefined, claim: string): string | null {
    const value = token?.[claim];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private toError(error: unknown, fallback: string): Error {
    if (error instanceof Error) {
      return new Error(`${fallback} ${error.message}`);
    }

    if (environment.production) {
      return new Error(fallback);
    }

    return new Error(`${fallback} Verifique se o Keycloak esta disponivel em ${environment.auth.keycloakUrl}.`);
  }
}

interface UserProfileResponse {
  readonly id?: string | null;
  readonly fullName?: string | null;
  readonly email?: string | null;
  readonly document?: string | null;
}

