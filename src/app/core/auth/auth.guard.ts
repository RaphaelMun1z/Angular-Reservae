import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = (_route, state): boolean => {
  const authStore = inject(AuthStore);

  if (authStore.authenticated()) {
    return true;
  }

  authStore.login(state.url);
  return false;
};
