import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const profileRoutes: Routes = [
  { path: 'perfil', loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile), canActivate: [authGuard], title: 'Reservae | Perfil' },
];
