import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { roleGuard } from '../../core/auth/role.guard';

export const checkoutRoutes: Routes = [
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Checkout' },
  { path: 'checkout/:eventId', loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Checkout' },
  // A rota de redirect não pode combinar redirectTo com canActivate. O destino /checkout aplica os guards.
  { path: 'carrinho', redirectTo: 'checkout', pathMatch: 'full' },
];
