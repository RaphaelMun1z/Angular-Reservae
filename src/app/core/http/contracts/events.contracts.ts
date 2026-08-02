import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { EventStatus } from '../../models/event-catalog.model';

export interface EventListItem {
  readonly id: string;
  readonly name: string;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly date?: string | null;
  readonly status?: EventStatus | null;
  readonly venueName?: string | null;
}

export interface EventSector {
  readonly id: string;
  readonly name: string;
  readonly basePrice?: number | null;
  readonly halfPrice?: number | null;
  readonly totalCapacity?: number | null;
  readonly reservedQuantity?: number | null;
  readonly soldQuantity?: number | null;
  readonly availableQuantity?: number | null;
}

export interface EventFilters {
  readonly search: string;
  readonly city: string | null;
  readonly state: string | null;
  readonly status: EventStatus | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}

export interface EventListResponse {
  readonly items: readonly EventListItem[];
  readonly totalElements: number;
  readonly totalPages: number;
  readonly size: number;
  readonly number: number;
  readonly numberOfElements: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly empty: boolean;
}

export interface EventApi {
  readonly supportsEventList?: boolean;
  listEvents(filters: EventFilters): Observable<EventListResponse>;
  getEvent(eventId: string): Observable<EventListItem>;
  listSectors(eventId: string): Observable<readonly EventSector[]>;
  addSector(eventId: string, request: EventSectorMutationRequest): Observable<unknown>;
  removeSector(eventId: string, sectorId: string): Observable<unknown>;
  createEvent(request: CreateEventRequest): Observable<EventListItem>;
}

export interface EventSectorMutationRequest {
  readonly sectorId: string;
  readonly basePrice: number;
  readonly halfPrice: number;
}

export interface CreateEventRequest {
  readonly title: string;
  readonly eventDate: string;
  readonly venueId: string;
  readonly sectorsPricing: readonly CreateEventSectorPricingRequest[];
}

export interface CreateEventSectorPricingRequest {
  readonly sectorId: string;
  readonly basePrice: number;
  readonly halfPrice: number;
}

export const EVENT_API = new InjectionToken<EventApi>('EVENT_API');
