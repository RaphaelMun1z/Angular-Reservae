import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  EventDetailsResponseDTO,
  EventSummaryResponse,
  PageResponse,
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
  readonly supportsEventList = true;

  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listEvents(filters: EventFilters): Observable<EventListResponse> {
    return this.http
      .get<PageResponse<EventSummaryResponse>>(this.apiUrl.url(EVENT_CATALOG_EVENTS_PATH), {
        params: this.toHttpParams(filters),
      })
      .pipe(map((page) => this.toEventListResponse(page)));
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

  private toEventListResponse(page: PageResponse<EventSummaryResponse>): EventListResponse {
    return {
      items: (page.content ?? []).map((event) => this.toEventListItem(event)),
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      size: page.size ?? 0,
      number: page.number ?? 0,
      numberOfElements: page.numberOfElements ?? 0,
      first: page.first ?? true,
      last: page.last ?? true,
      empty: page.empty ?? (page.content ?? []).length === 0,
    };
  }

  private toEventListItem(event: EventDetailsResponseDTO | EventSummaryResponse): EventListItem {
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

  private toHttpParams(filters: EventFilters): HttpParams {
    let params = new HttpParams();

    const values: Record<string, string | number | null | undefined> = {
      search: filters.search,
      city: filters.city,
      state: filters.state,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      size: filters.size,
      sort: filters.sort,
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      const stringValue = String(value).trim();
      if (!stringValue) {
        return;
      }

      params = params.set(key, stringValue);
    });

    return params;
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
