import { APP_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AUTH_INTEGRATION, AuthStore } from './auth.store';

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AUTH_INTEGRATION,
      useExisting: AuthService,
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const authStore = inject(AuthStore);
        return () => firstValueFrom(authStore.initialize());
      },
    },
  ]);
}

