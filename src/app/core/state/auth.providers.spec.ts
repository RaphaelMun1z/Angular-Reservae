import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { AUTH_INTEGRATION } from './auth.store';
import { provideAuth } from './auth.providers';

describe('provideAuth', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should provide the Keycloak auth service as the auth integration', () => {
    TestBed.configureTestingModule({
      providers: [provideAuth()],
    });

    const integration = TestBed.inject(AUTH_INTEGRATION);

    expect(integration).toBe(TestBed.inject(AuthService));
  });
});

