import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthIntegration, AuthSession } from './auth.store';

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
      email: null,
      roles: [],
    };

    return of(void 0);
  }

  private authenticatedSession(user: MockAuthUser): AuthSession {
    return {
      authenticated: true,
      userId: user.userId,
      username: user.username,
      email: user.email,
      roles: [...user.roles],
    };
  }
}
