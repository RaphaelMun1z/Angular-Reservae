import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketType } from '../../models/event-catalog.model';
import { CheckoutRequestDTO, OrderItemResponseDTO, OrderStatus } from '../../models/order.model';

export interface CheckoutItem {
  readonly sectorId: string;
  readonly sectorName: string;
  readonly quantity: number;
  readonly ticketType: TicketType;
  readonly unitPrice: number;
}

export interface CheckoutOrder {
  readonly id: string;
  readonly userId?: string | null;
  readonly eventId: string | null;
  readonly eventTitle?: string | null;
  readonly eventDate?: string | null;
  readonly venueName?: string | null;
  readonly venueCity?: string | null;
  readonly venueState?: string | null;
  readonly status: OrderStatus | null;
  readonly createdAt?: string | null;
  readonly totalAmount: number | null;
  readonly paymentUrl: string | null;
  readonly items: readonly OrderItemResponseDTO[];
}

export interface CheckoutApi {
  startCheckout(request: CheckoutRequestDTO): Observable<CheckoutOrder>;
  getOrder(orderId: string): Observable<CheckoutOrder>;
  findOrdersByUserId(userId: string): Observable<readonly CheckoutOrder[]>;
}

export const CHECKOUT_API = new InjectionToken<CheckoutApi>('CHECKOUT_API');
