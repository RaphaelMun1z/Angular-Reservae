import { Routes } from '@angular/router';

export const errorRoutes: Routes = [
  { path: '403', loadComponent: () => import('./pages/error403/error403').then((m) => m.Error403), title: 'Reservae | Acesso negado' },
  { path: '404', loadComponent: () => import('./pages/error404/error404').then((m) => m.Error404), title: 'Reservae | Pagina nao encontrada' },
  { path: '500', loadComponent: () => import('./pages/error500/error500').then((m) => m.Error500), title: 'Reservae | Erro interno' },
  { path: '503', loadComponent: () => import('./pages/error503/error503').then((m) => m.Error503), title: 'Reservae | Servico indisponivel' },
  { path: '**', loadComponent: () => import('./pages/error404/error404').then((m) => m.Error404), title: 'Reservae | Pagina nao encontrada' },
];
