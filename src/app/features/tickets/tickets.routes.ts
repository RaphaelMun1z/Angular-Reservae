import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { roleGuard } from '../../core/auth/role.guard';

export const ticketRoutes: Routes = [
  { path: 'meus-ingressos', loadComponent: () => import('./pages/my-tickets/my-tickets').then((m) => m.MyTickets), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Meus ingressos' },
  { path: 'detalhes-ingresso', loadComponent: () => import('./pages/ticket-details/ticket-details').then((m) => m.TicketDetails), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Detalhes do ingresso' },
  { path: 'detalhes-ingresso/:ticketId', loadComponent: () => import('./pages/ticket-details/ticket-details').then((m) => m.TicketDetails), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Detalhes do ingresso' },
  { path: 'transferir-ingresso', loadComponent: () => import('./pages/ticket-transfer/ticket-transfer').then((m) => m.TicketTransfer), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Transferir ingresso' },
];
