import { Routes } from '@angular/router';

export const supportRoutes: Routes = [
  { path: 'suporte', loadComponent: () => import('./pages/support').then((m) => m.Support), title: 'Reservae | Suporte' },
];
