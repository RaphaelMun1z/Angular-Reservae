import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Ticket } from '../../models/ticket.model';

export interface TicketTransferRequest {
  readonly ticketId: string;
  readonly recipientEmail: string;
}

export interface TicketApi {
  listTickets(userId: string): Observable<readonly Ticket[]>;
  getTicket(ticketId: string): Observable<Ticket>;
  revokeTicket(ticketId: string): Observable<Ticket>;
  transferTicket(request: TicketTransferRequest): Observable<Ticket>;
}

export const TICKET_API = new InjectionToken<TicketApi>('TICKET_API');
