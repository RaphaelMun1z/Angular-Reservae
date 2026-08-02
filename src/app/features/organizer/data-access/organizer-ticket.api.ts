import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiUrlService } from '../../../core/http/api-url.service';
import { OrganizerTicketViewModel } from '../organizer.models';

const TICKETS_PATH = '/ticket-service/api/tickets/v1';

@Injectable({ providedIn: 'root' })
export class OrganizerTicketApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listByEvent(eventId: string): Observable<readonly OrganizerTicketViewModel[]> {
    return this.http.get<unknown>(this.apiUrl.url(`${TICKETS_PATH}/event/${encodeURIComponent(eventId)}`)).pipe(map((response) => this.toTickets(response)));
  }

  private toTickets(response: unknown): readonly OrganizerTicketViewModel[] {
    const values = Array.isArray(response) ? response : this.record(response)?.['content'];
    return Array.isArray(values) ? values.filter((value): value is Record<string, unknown> => this.record(value) !== null).map((value) => ({
      id: this.string(value['id'] ?? value['ticketId']) ?? 'Ingresso sem identificador',
      status: this.string(value['status']),
      createdAt: this.string(value['createdAt'] ?? value['createdDate']),
      sectorName: this.string(value['sectorName']),
      ticketType: this.string(value['ticketType']),
    })) : [];
  }

  private record(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null; }
  private string(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value : null; }
}
