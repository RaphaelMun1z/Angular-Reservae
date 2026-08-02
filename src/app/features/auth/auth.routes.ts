import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: 'recuperar-senha', loadComponent: () => import('./pages/forgot-password').then((m) => m.ForgotPassword), title: 'Reservae | Recuperar senha' },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login), title: 'Reservae | Entrar' },
  { path: 'cadastro', loadComponent: () => import('./pages/register').then((m) => m.Register), title: 'Reservae | Cadastro' },
];
