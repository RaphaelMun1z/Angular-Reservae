import { TicketType } from './event-catalog.model';

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'RESERVATION_FAILED'
  | 'CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface OrderItemRequestDTO {
  readonly sectorId: string;
  readonly ticketType: TicketType;
  readonly quantity?: number;
}

export interface CheckoutRequestDTO {
  readonly userId: string;
  readonly eventId: string;
  readonly items: readonly OrderItemRequestDTO[];
}

export interface OrderSummaryResponseDTO {
  readonly orderId?: string;
  readonly totalAmount?: number;
  readonly status?: OrderStatus;
  readonly paymentUrl?: string;
}

export interface OrderItemResponseDTO {
  readonly orderItemId?: string;
  readonly sectorId?: string;
  readonly reservationId?: string;
  readonly ticketType?: TicketType;
  readonly quantity?: number;
  readonly appliedPrice?: number;
  readonly subtotal?: number;
}

export interface OrderResponseDTO {
  readonly orderId?: string;
  readonly userId?: string;
  readonly totalAmount?: number;
  readonly status?: OrderStatus;
  readonly paymentUrl?: string;
  readonly itens?: readonly OrderItemResponseDTO[];
}
