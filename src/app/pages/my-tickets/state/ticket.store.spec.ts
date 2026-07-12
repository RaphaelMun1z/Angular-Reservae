import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthStore } from '../../../core/state/auth.store';
import { Ticket } from '../../../core/models/ticket.model';
import { TICKET_API, TicketApi, TicketStore, TicketTransferRequest } from './ticket.store';

class FakeTicketApi implements TicketApi {
  tickets: readonly Ticket[] = [{ id: 'ticket-1', eventId: 'event-1', status: 'VALID' }];
  transferResponse: Ticket = {
    id: 'ticket-1',
    eventId: 'event-1',
    status: 'REVOKED',
  };
  failList = false;
  listCalls = 0;
  transferCalls = 0;

  listTickets(): Observable<readonly Ticket[]> {
    this.listCalls += 1;

    if (this.failList) {
      return throwError(() => new Error('offline'));
    }

    return of(this.tickets);
  }

  getTicket(ticketId: string): Observable<Ticket> {
    return of({ id: ticketId, eventId: 'event-1', status: 'VALID' });
  }

  revokeTicket(ticketId: string): Observable<Ticket> {
    return of({ id: ticketId, eventId: 'event-1', status: 'REVOKED' });
  }

  transferTicket(_request: TicketTransferRequest): Observable<Ticket> {
    this.transferCalls += 1;
    return of(this.transferResponse);
  }
}

describe('TicketStore', () => {
  let store: TicketStore;
  let api: FakeTicketApi;

  beforeEach(() => {
    api = new FakeTicketApi();
    TestBed.configureTestingModule({
      providers: [TicketStore, { provide: TICKET_API, useValue: api }],
    });
    store = TestBed.inject(TicketStore);
    TestBed.inject(AuthStore).updateSession({
      authenticated: true,
      userId: 'user-1',
      username: 'User',
      roles: [],
    });
  });

  it('should load tickets', () => {
    store.loadTickets();

    expect(store.hasTickets()).toBe(true);
    expect(store.tickets()[0]?.id).toBe('ticket-1');
  });

  it('should not load tickets without userId', () => {
    TestBed.inject(AuthStore).clearSession();

    store.loadTickets();

    expect(api.listCalls).toBe(0);
    expect(store.error()).toContain('Usuario autenticado');
  });

  it('should expose list errors', () => {
    api.failList = true;

    store.loadTickets();

    expect(store.error()).toContain('offline');
  });

  it('should filter tickets by status', () => {
    api.tickets = [
      { id: 'ticket-1', eventId: 'event-1', status: 'VALID' },
      { id: 'ticket-2', eventId: 'event-1', status: 'USED' },
    ];

    store.loadTickets();
    store.setStatusFilter('VALID');

    expect(store.filteredTickets().length).toBe(1);
    expect(store.filteredTickets()[0]?.status).toBe('VALID');
  });

  it('should load selected ticket by id', () => {
    store.loadTicket('ticket-1');

    expect(store.selectedTicket()?.id).toBe('ticket-1');
  });

  it('should update ticket after revoke', () => {
    store.loadTickets();

    store.revokeTicket('ticket-1');

    expect(store.selectedTicket()?.status).toBe('REVOKED');
    expect(store.tickets()[0]?.status).toBe('REVOKED');
  });

  it('should keep ticket transfer unavailable when endpoint is not documented', () => {
    store.transferTicket({ ticketId: 'ticket-1', recipientEmail: 'novo@reservae.com' });

    expect(api.transferCalls).toBe(0);
    expect(store.error()).toContain('Transferencia de ingresso indisponivel');
  });
});
