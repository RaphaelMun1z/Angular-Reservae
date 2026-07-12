import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AUTH_INTEGRATION, AuthIntegration, AuthSession, AuthStore } from './auth.store';

class FakeAuthIntegration implements AuthIntegration {
  session: AuthSession = {
    authenticated: true,
    userId: 'user-1',
    username: 'Admin',
    email: 'admin@reservae.test',
    roles: ['ADMIN'],
  };

  currentSession(): Observable<AuthSession> {
    return of(this.session);
  }

  login(): Observable<AuthSession> {
    return of(this.session);
  }

  logout(): Observable<void> {
    return of(void 0);
  }
}

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_INTEGRATION, useClass: FakeAuthIntegration }],
    });

    store = TestBed.inject(AuthStore);
    store.clearSession();
  });

  it('should expose authenticated state', () => {
    store.refreshSession();

    expect(store.authenticated()).toBe(true);
    expect(store.userId()).toBe('user-1');
    expect(store.email()).toBe('admin@reservae.test');
  });

  it('should derive roles', () => {
    store.updateSession({
      authenticated: true,
      userId: 'organizer-1',
      username: 'Organizer',
      email: 'organizer@reservae.test',
      roles: ['ORGANIZER'],
    });

    expect(store.isOrganizer()).toBe(true);
    expect(store.canValidateTickets()).toBe(true);
  });

  it('should clear session on logout', () => {
    store.refreshSession();
    store.logout();

    expect(store.authenticated()).toBe(false);
    expect(store.roles()).toEqual([]);
  });

  it('should keep unauthenticated state when cleared', () => {
    store.clearSession();

    expect(store.authenticated()).toBe(false);
  });
});
