import { TestBed } from '@angular/core/testing';
import { AUTH_INTEGRATION, AuthIntegration, AuthStore } from './auth.store';
import { provideAuth } from './auth.providers';
import { MockAuthIntegration } from './mock-auth.integration';

describe('provideAuth', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should select mock auth in development when useMock is true', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuth({
          production: false,
          auth: {
            useMock: true,
          },
        }),
      ],
    });

    const integration = TestBed.inject(AUTH_INTEGRATION);
    const store = TestBed.inject(AuthStore);

    expect(integration).toBeInstanceOf(MockAuthIntegration);
    expect(store.authenticated()).toBe(true);
    expect(store.userId()).toBe('SUBSTITUIR_POR_UUID_VALIDO_DO_BACKEND');
    expect(store.username()).toBe('Raphael Muniz');
    expect(store.email()).toBe('raphaelmunizvarela@hotmail.com');
    expect(store.roles()).toEqual(['USER']);
  });

  it('should not select mock auth in production', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuth({
          production: true,
          auth: {
            useMock: true,
          },
        }),
      ],
    });

    const integration = TestBed.inject<AuthIntegration | null>(AUTH_INTEGRATION, null);
    const store = TestBed.inject(AuthStore);

    expect(integration).toBeNull();
    expect(store.authenticated()).toBe(false);
    expect(store.userId()).toBeNull();
  });

  it('should not select mock auth when useMock is false', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuth({
          production: false,
          auth: {
            useMock: false,
          },
        }),
      ],
    });

    const integration = TestBed.inject<AuthIntegration | null>(AUTH_INTEGRATION, null);

    expect(integration).toBeNull();
  });
});
