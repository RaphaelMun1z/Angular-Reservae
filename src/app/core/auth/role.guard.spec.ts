import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('redirects an organizer from customer routes to the organizer dashboard', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.updateSession({ initialized: true, authenticated: true, userId: 'organizer-1', username: 'organizer', fullName: 'Organizer', email: null, roles: ['ORGANIZER'], profile: null });

    const result = TestBed.runInInjectionContext(() => roleGuard({ data: { roles: ['CUSTOMER', 'ADMIN'] } } as never, { url: '/checkout' } as never));

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/organizer/management/events');
  });

  it('allows a customer on customer routes', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.updateSession({ initialized: true, authenticated: true, userId: 'customer-1', username: 'customer', fullName: 'Customer', email: null, roles: ['CUSTOMER'], profile: null });

    const result = TestBed.runInInjectionContext(() => roleGuard({ data: { roles: ['CUSTOMER'] } } as never, { url: '/meus-ingressos' } as never));

    expect(result).toBe(true);
  });

  it('keeps customers out of organizer routes', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.updateSession({ initialized: true, authenticated: true, userId: 'customer-1', username: 'customer', fullName: 'Customer', email: null, roles: ['CUSTOMER'], profile: null });

    const result = TestBed.runInInjectionContext(() => roleGuard({ data: { roles: ['ORGANIZER', 'ADMIN'] } } as never, { url: '/organizer/dashboard' } as never));

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/403');
  });
});
