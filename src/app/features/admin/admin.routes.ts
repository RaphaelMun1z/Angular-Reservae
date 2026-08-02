import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { ScannerStore } from './scanner/state/scanner.store';

export const adminRoutes: Routes = [
  { path: 'criar-evento', loadComponent: () => import('./create-event/create-event').then((m) => m.CreateEvent), canActivate: [roleGuard], data: { roles: ['ADMIN'] }, title: 'Reservae | Criar evento' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard), canActivate: [roleGuard], data: { roles: ['ADMIN', 'ORGANIZER', 'SUPPORT'] }, title: 'Reservae | Dashboard' },
  { path: 'clientes', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard), canActivate: [roleGuard], data: { roles: ['ADMIN'] }, title: 'Reservae | Clientes' },
  { path: 'transacoes', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard), canActivate: [roleGuard], data: { roles: ['ADMIN'] }, title: 'Reservae | Transacoes' },
  { path: 'relatorios', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard), canActivate: [roleGuard], data: { roles: ['ADMIN'] }, title: 'Reservae | Relatorios' },
  { path: 'scanner', loadComponent: () => import('./scanner/pages/gate-scanner').then((m) => m.GateScanner), canActivate: [roleGuard], data: { roles: ['ADMIN'] }, providers: [ScannerStore], title: 'Reservae | Validacao de ingresso' },
  { path: 'scanner/:eventId', loadComponent: () => import('./scanner/pages/gate-scanner').then((m) => m.GateScanner), canActivate: [roleGuard], data: { roles: ['ADMIN'] }, providers: [ScannerStore], title: 'Reservae | Validacao de ingresso' },
  { path: 'configuracoes', loadComponent: () => import('./settings/settings').then((m) => m.Settings), canActivate: [roleGuard], data: { roles: ['ADMIN', 'ORGANIZER', 'SUPPORT'] }, title: 'Reservae | Configuracoes' },
];
