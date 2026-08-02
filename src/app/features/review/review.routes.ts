import { Routes } from '@angular/router';

export const reviewRoutes: Routes = [
  { path: 'avaliacao', loadComponent: () => import('./pages/review').then((m) => m.Review), title: 'Reservae | Avaliacao' },
];
