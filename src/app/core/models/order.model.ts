import { TicketType } from './event-catalog.model';

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_APPROVED'
  | 'APPROVED'
  | 'PAID'
  | 'PROCESSING'
  | 'RESERVATION_FAILED'
  | 'RESERVATION_REJECTED'
  | 'CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'FAILED'
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
  readonly eventId?: string;
  readonly createdAt?: string;
  readonly totalAmount?: number;
  readonly status?: OrderStatus;
  readonly paymentUrl?: string;
  readonly itens?: readonly OrderItemResponseDTO[];
  readonly items?: readonly OrderItemResponseDTO[];
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
  readonly eventId?: string;
  readonly userId?: string;
  readonly createdAt?: string;
  readonly totalAmount?: number;
  readonly status?: OrderStatus;
  readonly paymentUrl?: string;
  readonly itens?: readonly OrderItemResponseDTO[];
  readonly items?: readonly OrderItemResponseDTO[];
}
