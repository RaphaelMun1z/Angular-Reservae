export type ReservationStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface EventSectorInventoryResponseDTO {
  readonly id?: string;
  readonly eventId?: string;
  readonly sectorId?: string;
  readonly capacity?: number;
  readonly reservedQuantity?: number;
  readonly soldQuantity?: number;
  readonly availableQuantity?: number;
  readonly environment?: string;
}

export interface ReservationStatusResponseDTO {
  readonly reservationId?: string;
  readonly status?: ReservationStatus;
  readonly expiresAt?: string;
  readonly environment?: string;
}
