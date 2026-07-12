import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthIntegration, AuthSession } from './auth.store';
import { UpdateUserProfileRequest, UserProfile } from '../auth/auth.models';

export interface MockAuthUser {
  readonly userId: string;
  readonly username: string;
  readonly email: string;
  readonly roles: readonly string[];
}

@Injectable()
export class MockAuthIntegration implements AuthIntegration {
  private readonly mockUser = environment.auth.mockUser;
  private session: AuthSession = this.authenticatedSession(this.mockUser);

  initialize(): Observable<AuthSession> {
    return of(this.session);
  }

  currentSession(): Observable<AuthSession> {
    return of(this.session);
  }

  login(): Observable<AuthSession> {
    this.session = this.authenticatedSession(this.mockUser);
    return of(this.session);
  }

  logout(): Observable<void> {
    this.session = {
      authenticated: false,
      userId: null,
      username: null,
      fullName: null,
      email: null,
      roles: [],
      initialized: true,
      profile: null,
    };

    return of(void 0);
  }

  updateMyProfile(request: UpdateUserProfileRequest): Observable<UserProfile> {
    const profile = {
      id: this.session.userId,
      fullName: request.fullName,
      email: this.session.email,
      document: request.document,
    };

    this.session = {
      ...this.session,
      fullName: profile.fullName,
      profile,
    };

    return of(profile);
  }

  private authenticatedSession(user: MockAuthUser): AuthSession {
    return {
      authenticated: true,
      initialized: true,
      userId: user.userId,
      username: user.username,
      fullName: user.username,
      email: user.email,
      roles: user.roles.filter((role) => role === 'CUSTOMER' || role === 'ADMIN'),
      profile: {
        id: user.userId,
        fullName: user.username,
        email: user.email,
        document: null,
      },
    };
  }
}
