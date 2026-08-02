import { Routes } from '@angular/router';
import { organizerRoutes } from './organizer.routes';

describe('Central organizer management routes', () => {
  const organizerRoute = organizerRoutes[0] as Routes[number];
  const children = organizerRoute.children ?? [];
  const managementRoute = children.find((route) => route.path === 'management');
  const managementChildren = managementRoute?.children ?? [];

  it('keeps the central management shell protected for organizer and admin', () => {
    expect(organizerRoute.data?.['roles']).toEqual(['ORGANIZER', 'ADMIN']);
    expect(managementRoute?.loadComponent).toBeTypeOf('function');
  });

  it('defines all management resources below the central shell', () => {
    expect(managementChildren.map((route) => route.path)).toEqual([
      '', 'events', 'events/create', 'venues/create', 'venues', 'events/:eventId', 'events/:eventId/edit',
      'events/:eventId/add-sector', 'events/:eventId/sectors', 'events/:eventId/sales',
      'events/:eventId/check-in', 'events/:eventId/reports',
    ]);
    expect(managementChildren.slice(1).every((route) => typeof route.loadComponent === 'function')).toBe(true);
  });

  it('loads event tables and forms directly in the central outlet', () => {
    expect(managementChildren.every((route) => !route.children?.length)).toBe(true);
    expect(managementChildren.slice(4).every((route) => typeof route.loadComponent === 'function')).toBe(true);
  });

  it('redirects legacy organizer URLs to the central structure', () => {
    const legacy = children.filter((route) => typeof route.redirectTo === 'string');
    expect(legacy.map((route) => route.path)).toEqual([
      'dashboard',
      'eventos/novo',
      'eventos/:eventId/editar',
      'eventos/:eventId/setores',
      'eventos/:eventId/vendas',
      'eventos/:eventId/check-in',
      'eventos/:eventId/relatorios',
      'eventos/:eventId',
      'eventos',
      '',
    ]);
    expect(legacy.every((route) => typeof route.redirectTo === 'string' && route.redirectTo.includes('management'))).toBe(true);
  });
});
