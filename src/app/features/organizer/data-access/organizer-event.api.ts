import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventApi, EventFilters, EventListItem, EventSector, EventSectorMutationRequest, EVENT_API } from '../../../core/http/contracts/events.contracts';

@Injectable({ providedIn: 'root' })
export class OrganizerEventApi {
  private readonly api = inject(EVENT_API) as EventApi;

  list(filters: EventFilters): Observable<{ readonly items: readonly EventListItem[] }> {
    return this.api.listEvents(filters);
  }

  get(eventId: string): Observable<EventListItem> { return this.api.getEvent(eventId); }
  sectors(eventId: string): Observable<readonly EventSector[]> { return this.api.listSectors(eventId); }
  addSector(eventId: string, request: EventSectorMutationRequest): Observable<unknown> { return this.api.addSector(eventId, request); }
  removeSector(eventId: string, sectorId: string): Observable<unknown> { return this.api.removeSector(eventId, sectorId); }
}
