import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrganizerAccessApi } from './organizer-access.api';
import { OrganizerOrderApi } from './organizer-order.api';
import { OrganizerTicketApi } from './organizer-ticket.api';

describe('Organizer data access', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), OrganizerAccessApi, OrganizerOrderApi, OrganizerTicketApi] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads orders by event', () => {
    const api = TestBed.inject(OrganizerOrderApi);
    api.listByEvent('event-1').subscribe((orders) => expect(orders[0]?.id).toBe('order-1'));
    const request = http.expectOne('http://localhost:8765/order-service/api/orders/v1/event/event-1/orders');
    expect(request.request.method).toBe('GET'); request.flush([{ id: 'order-1', status: 'CONFIRMED' }]);
  });

  it('loads tickets by event', () => {
    const api = TestBed.inject(OrganizerTicketApi);
    api.listByEvent('event-1').subscribe((tickets) => expect(tickets[0]?.id).toBe('ticket-1'));
    const request = http.expectOne('http://localhost:8765/ticket-service/api/tickets/v1/event/event-1');
    expect(request.request.method).toBe('GET'); request.flush([{ ticketId: 'ticket-1', status: 'VALID' }]);
  });

  it('validates access and loads event logs', () => {
    const api = TestBed.inject(OrganizerAccessApi);
    api.validate({ qrCodeHash: 'hash', gateId: 'gate-1' }).subscribe((response) => expect(response.isAllowed).toBe(true));
    const validation = http.expectOne('http://localhost:8765/ticket-service/api/tickets/access/v1/validate');
    expect(validation.request.method).toBe('POST'); validation.flush({ isAllowed: true, result: 'GRANTED' });
    api.logs('event-1').subscribe((logs) => expect(logs[0]?.gateId).toBe('gate-1'));
    const logs = http.expectOne((request) => request.url === 'http://localhost:8765/ticket-service/api/tickets/access/v1/logs' && request.params.get('eventId') === 'event-1');
    expect(logs.request.method).toBe('GET'); logs.flush([{ id: 'log-1', gateId: 'gate-1', result: 'GRANTED' }]);
  });
});
