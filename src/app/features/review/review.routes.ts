import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { roleGuard } from '../../core/auth/role.guard';

export const reviewRoutes: Routes = [
  {
    path: 'avaliacao',
    loadComponent: () => import('./pages/review').then((m) => m.Review),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
    title: 'Reservae | Avaliacao',
  },
];
