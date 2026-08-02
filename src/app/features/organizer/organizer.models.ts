import { EventListItem, EventSector } from '../../core/http/contracts/events.contracts';

export type OrganizerEventStatus = string;

export interface OrganizerEventSummaryViewModel extends Omit<EventListItem, 'status'> {
  readonly status: OrganizerEventStatus | null;
}

export interface OrganizerEventDetailsViewModel extends OrganizerEventSummaryViewModel {
  readonly sectors: readonly EventSector[];
}

export interface OrganizerSectorManagementItemViewModel {
  readonly id: string;
  readonly name: string;
  readonly capacity: number | null;
  readonly fullPrice: number | null;
  readonly halfPrice: number | null;
  readonly reservedQuantity: number | null;
  readonly soldQuantity: number | null;
  readonly available: number | null;
}

export interface OrganizerOrderViewModel {
  readonly id: string;
  readonly status: string | null;
  readonly totalAmount: number | null;
  readonly createdAt: string | null;
  readonly itemsCount: number | null;
  readonly sectorNames: readonly string[];
}

export interface OrganizerTicketViewModel {
  readonly id: string;
  readonly status: string | null;
  readonly createdAt: string | null;
  readonly sectorName: string | null;
  readonly ticketType: string | null;
}

export interface OrganizerAccessLogViewModel {
  readonly id: string;
  readonly gateId: string | null;
  readonly result: string | null;
  readonly createdAt: string | null;
  readonly ticketId: string | null;
}

export interface OrganizerCheckinValidationViewModel {
  readonly code: string;
  readonly isAllowed: boolean;
  readonly result: string | null;
  readonly message: string | null;
  readonly ticketId: string | null;
  readonly sectorName: string | null;
}
