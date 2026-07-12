import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  EventDetailsResponseDTO,
  SectorPricingResponseDTO,
} from '../models/event-catalog.model';
import { EventSectorInventoryResponseDTO } from '../models/inventory.model';
import { ApiUrlService } from './api-url.service';
import {
  EventApi,
  EventFilters,
  EventListItem,
  EventListResponse,
  EventSector,
} from '../../pages/events/state/event.store';

const EVENT_CATALOG_EVENTS_PATH = '/event-catalog-service/api/events/v1';
const INVENTORY_PATH = '/inventory-service/api/inventory/v1';

@Injectable({
  providedIn: 'root',
})
export class HttpEventApi implements EventApi {
  readonly supportsEventList = false;

  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listEvents(_filters: EventFilters): Observable<EventListResponse> {
    return throwError(
      () => new Error('O OpenAPI do event-catalog-service nao documenta endpoint de listagem de eventos.'),
    );
  }

  getEvent(eventId: string): Observable<EventListItem> {
    return this.http
      .get<EventDetailsResponseDTO>(this.apiUrl.url(`${EVENT_CATALOG_EVENTS_PATH}/${eventId}`))
      .pipe(map((event) => this.toEventListItem(event)));
  }

  listSectors(eventId: string): Observable<readonly EventSector[]> {
    return this.http
      .get<EventDetailsResponseDTO>(this.apiUrl.url(`${EVENT_CATALOG_EVENTS_PATH}/${eventId}`))
      .pipe(
        map((event) => (event.sectorsDetails ?? []).map((sector) => this.toEventSector(sector))),
        switchMap((sectors) => this.enrichSectorsWithAvailability(eventId, sectors)),
      );
  }

  consultTicketPrices(
    eventId: string,
    sectorIds: readonly string[],
  ): Observable<readonly SectorPricingResponseDTO[]> {
    return this.http.post<readonly SectorPricingResponseDTO[]>(
      this.apiUrl.url(`${EVENT_CATALOG_EVENTS_PATH}/${eventId}/sectors/prices`),
      [...sectorIds],
    );
  }

  listSectorsWithPrices(eventId: string): Observable<readonly EventSector[]> {
    return this.listSectors(eventId).pipe(
      switchMap((sectors) =>
        this.consultTicketPrices(
          eventId,
          sectors.map((sector) => sector.id),
        ).pipe(
          map((prices) =>
            sectors.map((sector) => {
              const price = prices.find((currentPrice) => currentPrice.sectorId === sector.id);
              return {
                ...sector,
                basePrice: price?.basePrice ?? sector.basePrice,
                halfPrice: price?.halfPrice ?? sector.halfPrice,
              };
            }),
          ),
        ),
      ),
    );
  }

  private toEventListItem(event: EventDetailsResponseDTO): EventListItem {
    return {
      id: event.eventId ?? '',
      name: event.title ?? '',
      city: event.venueCity ?? null,
      date: event.eventDate ?? null,
      status: event.status ?? null,
      venueName: event.venueName ?? null,
      state: event.venueState ?? null,
    };
  }

  private toEventSector(sector: NonNullable<EventDetailsResponseDTO['sectorsDetails']>[number]): EventSector {
    return {
      id: sector.sectorId ?? '',
      name: sector.sectorName ?? '',
      basePrice: sector.sectorBasePrice ?? null,
      halfPrice: sector.sectorHalfPrice ?? null,
      totalCapacity: sector.totalCapacity ?? null,
    };
  }

  private enrichSectorsWithAvailability(
    eventId: string,
    sectors: readonly EventSector[],
  ): Observable<readonly EventSector[]> {
    if (sectors.length === 0) {
      return of([]);
    }

    return forkJoin(
      sectors.map((sector) =>
        this.http
          .get<EventSectorInventoryResponseDTO>(
            this.apiUrl.url(`${INVENTORY_PATH}/event/${eventId}/sector/${sector.id}`),
          )
          .pipe(
            map((inventory) => ({
              ...sector,
              availableQuantity: inventory.availableQuantity ?? null,
            })),
            catchError(() => of(sector)),
          ),
      ),
    );
  }
}
