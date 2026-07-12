export type EventStatus = 'SCHEDULED' | 'CANCELED' | 'FINISHED';
export type TicketType = 'FULL_TICKET_PRICE' | 'HALF_TICKET_PRICE';

export interface EventSummaryResponse {
  readonly eventId?: string;
  readonly title?: string;
  readonly eventDate?: string;
  readonly status?: EventStatus;
  readonly venueName?: string;
  readonly venueCity?: string;
  readonly venueState?: string;
}

export interface EventFilter {
  readonly search?: string;
  readonly city?: string;
  readonly state?: string;
  readonly status?: EventStatus;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly page?: number;
  readonly size?: number;
  readonly sort?: string;
}

export interface PageResponse<T> {
  readonly content?: readonly T[];
  readonly totalElements?: number;
  readonly totalPages?: number;
  readonly size?: number;
  readonly number?: number;
  readonly numberOfElements?: number;
  readonly first?: boolean;
  readonly last?: boolean;
  readonly empty?: boolean;
}

export interface EventSectorDetailsDTO {
  readonly eventId?: string;
  readonly sectorId?: string;
  readonly sectorName?: string;
  readonly sectorBasePrice?: number;
  readonly sectorHalfPrice?: number;
  readonly totalCapacity?: number;
}

export interface EventDetailsResponseDTO {
  readonly eventId?: string;
  readonly title?: string;
  readonly eventDate?: string;
  readonly status?: EventStatus;
  readonly venueName?: string;
  readonly venueCity?: string;
  readonly venueState?: string;
  readonly sectorsDetails?: readonly EventSectorDetailsDTO[];
}

export interface SectorPricingResponseDTO {
  readonly sectorId?: string;
  readonly sectorName?: string;
  readonly basePrice?: number;
  readonly halfPrice?: number;
}
