import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Ticket } from '../models/ticket.model';
import { ApiUrlService } from './api-url.service';
import { TicketApi, TicketTransferRequest } from '../../pages/my-tickets/state/ticket.store';

const TICKET_PATH = '/ticket-service/api/tickets/v1';

@Injectable({
  providedIn: 'root',
})
export class HttpTicketApi implements TicketApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listTickets(userId: string): Observable<readonly Ticket[]> {
    return this.http.get<readonly Ticket[]>(this.apiUrl.url(`${TICKET_PATH}/user/${userId}`));
  }

  getTicket(ticketId: string): Observable<Ticket> {
    return this.http.get<Ticket>(this.apiUrl.url(`${TICKET_PATH}/${ticketId}`));
  }

  revokeTicket(ticketId: string): Observable<Ticket> {
    return this.http.patch<Ticket>(this.apiUrl.url(`${TICKET_PATH}/${ticketId}/revoke`), null);
  }

  transferTicket(_request: TicketTransferRequest): Observable<Ticket> {
    return throwError(
      () => new Error('O OpenAPI do ticket-service nao documenta endpoint de transferencia de ingresso.'),
    );
  }
}
