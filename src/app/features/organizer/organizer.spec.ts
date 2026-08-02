import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrganizerAccessApi } from './data-access/organizer-access.api';
import { OrganizerEventApi } from './data-access/organizer-event.api';
import { OrganizerOrderApi } from './data-access/organizer-order.api';
import { OrganizerTicketApi } from './data-access/organizer-ticket.api';
import { OrganizerVenueApi } from './data-access/organizer-venue.api';
import { OrganizerDashboard } from './pages/organizer-dashboard/organizer-dashboard';
import { OrganizerEventCheckin } from './pages/organizer-event-checkin/organizer-event-checkin';
import { OrganizerEventForm } from './pages/organizer-event-form/organizer-event-form';
import { OrganizerEventReports } from './pages/organizer-event-reports/organizer-event-reports';
import { OrganizerEventSales } from './pages/organizer-event-sales/organizer-event-sales';
import { OrganizerEventSectors } from './pages/organizer-event-sectors/organizer-event-sectors';
import { OrganizerEvents } from './pages/organizer-events/organizer-events';

const routeStub = { snapshot: { paramMap: { get: () => 'event-1', has: () => false } } };
const eventApi = { list: () => of({ items: [] }), get: () => of(null), sectors: () => of([]) };
const orderApi = { listByEvent: () => of([]) };
const ticketApi = { listByEvent: () => of([]) };
const accessApi = { logs: () => of([]), validate: () => of({ isAllowed: false }), toValidation: (code: string, response: { isAllowed?: boolean }) => ({ code, isAllowed: response.isAllowed === true, result: null, message: null, ticketId: null, sectorName: null }) };
const venueApi = { list: () => of([]), listByLocation: () => of([]), get: () => of({ id: '', name: '', city: null, state: null, totalCapacity: null, sectors: [] }) };

async function create<T>(component: Type<T>): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [component], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: routeStub }, { provide: OrganizerEventApi, useValue: eventApi }, { provide: OrganizerOrderApi, useValue: orderApi }, { provide: OrganizerTicketApi, useValue: ticketApi }, { provide: OrganizerAccessApi, useValue: accessApi }, { provide: OrganizerVenueApi, useValue: venueApi }] }).compileComponents();
  const fixture = TestBed.createComponent(component); fixture.detectChanges(); return fixture;
}

describe('Organizer area', () => {
  it('renders only the central dashboard navigation', async () => {
    const fixture = await create(OrganizerDashboard);
    expect(fixture.nativeElement.textContent).toContain('Eventos');
    expect(fixture.nativeElement.textContent).toContain('Locais');
    expect(fixture.nativeElement.textContent).not.toContain('Gerencie seus eventos');
  });

  it('renders the events empty state', async () => {
    const fixture = await create(OrganizerEvents);
    expect(fixture.nativeElement.textContent).toContain('Nenhum evento encontrado');
  });

  const pages: readonly Type<unknown>[] = [OrganizerEventForm, OrganizerEventSectors, OrganizerEventSales, OrganizerEventCheckin, OrganizerEventReports];
  pages.forEach((page) => it(`renders ${page.name} with real-data empty states`, async () => {
    const fixture = await create(page);
    expect(fixture.nativeElement.textContent).toMatch(/depend|Nenhum|Ainda|Formulário|indisponível|não encontrado/i);
  }));
});
