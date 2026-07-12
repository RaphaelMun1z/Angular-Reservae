export type TicketStatus = 'VALID' | 'USED' | 'REVOKED';
export type AccessValidationResultStatus =
  | 'GRANTED'
  | 'DENIED_USED'
  | 'DENIED_REVOKED'
  | 'DENIED_INVALID';

export interface Ticket {
  readonly id?: string;
  readonly orderId?: string;
  readonly eventId?: string;
  readonly userId?: string;
  readonly sectorId?: string;
  readonly reservationId?: string;
  readonly ticketType?: string;
  readonly qrCodeHash?: string;
  readonly status?: TicketStatus;
  readonly createdAt?: string;
  readonly usedAt?: string;
}

export interface ValidateAccessRequestDTO {
  readonly qrCodeHash: string;
  readonly gateId: string;
}

export interface AccessValidationResponseDTO {
  readonly isAllowed?: boolean;
  readonly result?: AccessValidationResultStatus;
  readonly message?: string;
  readonly sectorName?: string;
  readonly ticketId?: string;
}

export interface Pageable {
  readonly page?: number;
  readonly size?: number;
  readonly sort?: readonly string[];
}

export interface PageResponse<T> {
  readonly totalPages?: number;
  readonly totalElements?: number;
  readonly numberOfElements?: number;
  readonly first?: boolean;
  readonly last?: boolean;
  readonly size?: number;
  readonly content?: readonly T[];
  readonly number?: number;
  readonly empty?: boolean;
}
