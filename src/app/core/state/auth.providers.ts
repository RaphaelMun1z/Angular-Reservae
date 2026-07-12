import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AUTH_INTEGRATION, AuthStore } from './auth.store';
import { MockAuthIntegration } from './mock-auth.integration';

export interface AuthEnvironment {
  readonly production: boolean;
  readonly auth: {
    readonly useMock: boolean;
  };
}

export function provideAuth(config: AuthEnvironment = environment): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...mockAuthProviders(config),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(AuthStore).refreshSession();
      },
    },
  ]);
}

function mockAuthProviders(config: AuthEnvironment): EnvironmentProviders[] {
  if (config.production || !config.auth.useMock) {
    return [];
  }

  return [
    makeEnvironmentProviders([
      {
        provide: AUTH_INTEGRATION,
        useClass: MockAuthIntegration,
      },
    ]),
  ];
}
