export type EventStatus = 'SCHEDULED' | 'CANCELED' | 'FINISHED';
export type TicketType = 'FULL_TICKET_PRICE' | 'HALF_TICKET_PRICE';

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
