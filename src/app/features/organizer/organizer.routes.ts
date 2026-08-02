import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { roleGuard } from '../../core/auth/role.guard';
import { OrganizerLayout } from './organizer-layout';

export const organizerRoutes: Routes = [{
  path: 'organizer',
  component: OrganizerLayout,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['ORGANIZER', 'ADMIN'] },
  children: [
    {
      path: 'management',
      loadComponent: () => import('./pages/organizer-dashboard/organizer-dashboard').then((m) => m.OrganizerDashboard),
      title: 'Reservae | Gestão de eventos',
      children: [
        { path: '', redirectTo: 'events', pathMatch: 'full' },
        { path: 'events', loadComponent: () => import('./pages/organizer-events/organizer-events').then((m) => m.OrganizerEvents) },
        { path: 'events/create', loadComponent: () => import('./pages/organizer-event-form/organizer-event-form').then((m) => m.OrganizerEventForm) },
        { path: 'venues', loadComponent: () => import('./pages/organizer-venues/organizer-venues').then((m) => m.OrganizerVenues) },
        { path: 'events/:eventId', loadComponent: () => import('./pages/organizer-event-overview/organizer-event-overview').then((m) => m.OrganizerEventOverview) },
        { path: 'events/:eventId/edit', loadComponent: () => import('./pages/organizer-event-form/organizer-event-form').then((m) => m.OrganizerEventForm) },
        { path: 'events/:eventId/add-sector', loadComponent: () => import('./pages/organizer-event-add-sector/organizer-event-add-sector').then((m) => m.OrganizerEventAddSector) },
        { path: 'events/:eventId/sectors', loadComponent: () => import('./pages/organizer-event-sectors/organizer-event-sectors').then((m) => m.OrganizerEventSectors) },
        { path: 'events/:eventId/sales', loadComponent: () => import('./pages/organizer-event-sales/organizer-event-sales').then((m) => m.OrganizerEventSales) },
        { path: 'events/:eventId/check-in', loadComponent: () => import('./pages/organizer-event-checkin/organizer-event-checkin').then((m) => m.OrganizerEventCheckin) },
        { path: 'events/:eventId/reports', loadComponent: () => import('./pages/organizer-event-reports/organizer-event-reports').then((m) => m.OrganizerEventReports) },
      ],
    },
    { path: 'dashboard', redirectTo: 'management', pathMatch: 'full' },
    { path: 'eventos/novo', redirectTo: 'management/events/create', pathMatch: 'full' },
    { path: 'eventos/:eventId/editar', redirectTo: 'management/events/:eventId/edit', pathMatch: 'full' },
    { path: 'eventos/:eventId/setores', redirectTo: 'management/events/:eventId/sectors', pathMatch: 'full' },
    { path: 'eventos/:eventId/vendas', redirectTo: 'management/events/:eventId/sales', pathMatch: 'full' },
    { path: 'eventos/:eventId/check-in', redirectTo: 'management/events/:eventId/check-in', pathMatch: 'full' },
    { path: 'eventos/:eventId/relatorios', redirectTo: 'management/events/:eventId/reports', pathMatch: 'full' },
    { path: 'eventos/:eventId', redirectTo: 'management/events/:eventId', pathMatch: 'full' },
    { path: 'eventos', redirectTo: 'management/events', pathMatch: 'full' },
    { path: '', redirectTo: 'management', pathMatch: 'full' },
  ],
}];
