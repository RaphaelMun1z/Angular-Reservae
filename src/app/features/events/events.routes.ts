import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const eventRoutes: Routes = [
  {
    path: 'club-vip',
    loadComponent: () => import('./pages/club-vip/club-vip').then((m) => m.ClubVip),
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
    title: 'Reservae | Club VIP',
  },
  {
    path: 'eventos',
    loadComponent: () => import('./pages/events').then((m) => m.Events),
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
    title: 'Reservae | Eventos',
  },
  {
    path: 'shows',
    loadComponent: () => import('./pages/shows/shows').then((m) => m.Shows),
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
    title: 'Reservae | Eventos',
  },
  {
    path: 'selecionar-setor',
    loadComponent: () =>
      import('./pages/sector-selection/sector-selection').then((m) => m.SectorSelection),
    title: 'Reservae | Detalhes do evento',
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
  },
  {
    path: 'selecionar-setor/:eventId',
    loadComponent: () =>
      import('./pages/sector-selection/sector-selection').then((m) => m.SectorSelection),
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
    title: 'Reservae | Detalhes do evento',
  },
];
