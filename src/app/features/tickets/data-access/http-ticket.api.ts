import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ticket, TicketResponseDTO } from '../../../core/models/ticket.model';
import { ApiUrlService } from '../../../core/http/api-url.service';
import { TicketApi, TicketTransferRequest } from '../../../core/http/contracts/tickets.contracts';

const TICKET_PATH = '/ticket-service/api/tickets/v1';

@Injectable({
  providedIn: 'root',
})
export class HttpTicketApi implements TicketApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listTickets(userId: string): Observable<readonly Ticket[]> {
    return this.http
      .get<readonly TicketResponseDTO[]>(this.apiUrl.url(`${TICKET_PATH}/user/${userId}`))
      .pipe(map((tickets) => tickets.map((ticket) => this.fromResponse(ticket))));
  }

  getTicket(ticketId: string): Observable<Ticket> {
    return this.http
      .get<TicketResponseDTO>(this.apiUrl.url(`${TICKET_PATH}/${ticketId}`))
      .pipe(map((ticket) => this.fromResponse(ticket)));
  }

  revokeTicket(ticketId: string): Observable<Ticket> {
    return this.http
      .patch<TicketResponseDTO>(this.apiUrl.url(`${TICKET_PATH}/${ticketId}/revoke`), null)
      .pipe(map((ticket) => this.fromResponse(ticket)));
  }

  transferTicket(_request: TicketTransferRequest): Observable<Ticket> {
    return throwError(
      () => new Error('O OpenAPI do ticket-service nao documenta endpoint de transferencia de ingresso.'),
    );
  }

  private fromResponse(ticket: TicketResponseDTO): Ticket {
    return {
      ...ticket,
      id: ticket.ticketId,
    };
  }
}
