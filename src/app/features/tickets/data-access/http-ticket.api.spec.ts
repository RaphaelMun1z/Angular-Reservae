import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTicketApi } from './http-ticket.api';

describe('HttpTicketApi', () => {
  let api: HttpTicketApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpTicketApi],
    });

    api = TestBed.inject(HttpTicketApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should list user tickets', () => {
    api.listTickets('user-1').subscribe((tickets) => {
      expect(tickets.length).toBe(1);
      expect(tickets[0]?.status).toBe('VALID');
    });

    const req = http.expectOne('http://localhost:8765/ticket-service/api/tickets/v1/user/user-1');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'ticket-1', userId: 'user-1', status: 'VALID' }]);
  });

  it('should revoke a ticket', () => {
    api.revokeTicket('ticket-1').subscribe((ticket) => {
      expect(ticket.status).toBe('REVOKED');
    });

    const req = http.expectOne('http://localhost:8765/ticket-service/api/tickets/v1/ticket-1/revoke');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({ id: 'ticket-1', status: 'REVOKED' });
  });
});
