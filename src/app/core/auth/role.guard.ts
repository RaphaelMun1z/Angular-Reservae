import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const roleGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const expectedRoles = route.data['roles'];
  const roles = Array.isArray(expectedRoles) ? expectedRoles.map((role) => String(role).toUpperCase()) : [];

  if (!authStore.authenticated()) {
    authStore.login(state.url);
    return false;
  }

  if (roles.length === 0 || roles.some((role) => authStore.hasRole(role))) {
    return true;
  }

  return router.parseUrl('/403');
};
