import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { EVENT_API, EventListItem, EventSector } from '../pages/events/state/event.store';

export interface EventDisplayData {
  readonly event: EventListItem | null;
  readonly sectors: readonly EventSector[];
}

@Injectable({
  providedIn: 'root',
})
export class EventDisplayDataService {
  private readonly api = inject(EVENT_API, { optional: true });
  private readonly cache = new Map<string, Observable<EventDisplayData>>();

  getEventData(eventId: string): Observable<EventDisplayData> {
    const cachedData = this.cache.get(eventId);

    if (cachedData) {
      return cachedData;
    }

    if (!this.api) {
      return throwError(() => new Error('Integracao de eventos nao configurada.'));
    }

    const request = forkJoin({
      event: this.api.getEvent(eventId).pipe(catchError(() => of(null))),
      sectors: this.api.listSectors(eventId).pipe(catchError(() => of([] as readonly EventSector[]))),
    }).pipe(
      map(({ event, sectors }) => ({ event, sectors })),
      catchError((error: unknown) => {
        this.cache.delete(eventId);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(eventId, request);
    return request;
  }
}
