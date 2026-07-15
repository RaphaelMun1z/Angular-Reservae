import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { CheckoutOrder } from '../checkout/state/checkout.store';
import { EventDisplayData, EventDisplayDataService } from '../../shared/event-display-data.service';
import { orderStatusLabel, ticketTypeLabel } from '../../shared/presentation-labels';
import { OrderStatus } from '../../core/models/order.model';
import { MyOrdersStore, OrderStatusFilter } from './state/my-orders.store';

@Component({
  selector: 'app-my-orders',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  providers: [MyOrdersStore],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  readonly store = inject(MyOrdersStore);
  private readonly eventDisplayData = inject(EventDisplayDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventData = signal<Record<string, EventDisplayData | null>>({});
  private readonly loadingEventIds = signal<Record<string, boolean>>({});

  readonly filters: readonly { value: OrderStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'AWAITING_PAYMENT', label: 'Aguardando pagamento' },
    { value: 'CONFIRMED', label: 'Confirmados' },
    { value: 'PENDING', label: 'Pendentes' },
    { value: 'PAYMENT_FAILED', label: 'Recusados' },
    { value: 'CANCELLED', label: 'Cancelados' },
  ];

  constructor() {
    effect(() => {
      const eventIds = Array.from(
        new Set(this.store.orders().map((order) => order.eventId).filter((eventId): eventId is string => Boolean(eventId))),
      );

      eventIds.forEach((eventId) => queueMicrotask(() => this.loadEventData(eventId)));
    });
  }

  ngOnInit(): void {
    this.store.loadOrders();
  }

  setFilter(status: OrderStatusFilter): void {
    this.store.setStatusFilter(status);
  }

  statusLabel(status: OrderStatus | string | null): string {
    return orderStatusLabel(status);
  }

  statusTone(status: OrderStatus | string | null): string {
    if (this.isPaid(status)) {
      return 'paid';
    }

    if (this.isPaymentPending(status)) {
      return 'warning';
    }

    if (this.isFailed(status)) {
      return 'danger';
    }

    return 'processing';
  }

  eventName(order: CheckoutOrder): string {
    if (!order.eventId) {
      return 'Evento nao informado';
    }

    return this.eventData()[order.eventId]?.event?.name || (this.isEventLoading(order.eventId) ? 'Carregando evento...' : 'Evento nao identificado');
  }

  eventMeta(order: CheckoutOrder): string {
    const event = order.eventId ? this.eventData()[order.eventId]?.event : null;
    const eventDate = this.formatDate(event?.date);
    const location = [event?.venueName, [event?.city, event?.state].filter(Boolean).join(', ')].filter(Boolean).join(' - ');

    return eventDate || location ? [eventDate, location].filter(Boolean).join(' - ') : 'Detalhes do evento indisponiveis';
  }

  shortOrderId(order: CheckoutOrder): string {
    return order.id ? order.id.slice(0, 8).toUpperCase() : 'Sem codigo';
  }

  fullOrderId(order: CheckoutOrder): string {
    return order.id || 'Nao informado';
  }

  orderDate(order: CheckoutOrder): string {
    return this.formatDate(order.createdAt) || 'Data nao informada';
  }

  totalTickets(order: CheckoutOrder): number {
    return order.items.reduce((total, item) => total + (item.quantity ?? 1), 0);
  }

  itemSummary(order: CheckoutOrder): string {
    if (order.items.length === 0) {
      return 'Itens indisponiveis';
    }

    return order.items
      .slice(0, 2)
      .map((item) => `${item.quantity ?? 1}x ${ticketTypeLabel(item.ticketType)}`)
      .join(' | ');
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  isPaymentPending(status: OrderStatus | string | null): boolean {
    return status === 'AWAITING_PAYMENT' || status === 'PAYMENT_PENDING';
  }

  isPaid(status: OrderStatus | string | null): boolean {
    return status === 'CONFIRMED' || status === 'PAYMENT_APPROVED' || status === 'APPROVED' || status === 'PAID';
  }

  isFailed(status: OrderStatus | string | null): boolean {
    return status === 'RESERVATION_FAILED' || status === 'RESERVATION_REJECTED' || status === 'PAYMENT_FAILED' || status === 'FAILED' || status === 'CANCELLED';
  }

  private isEventLoading(eventId: string): boolean {
    return Boolean(this.loadingEventIds()[eventId]);
  }

  private loadEventData(eventId: string): void {
    if (this.eventData()[eventId] !== undefined || this.loadingEventIds()[eventId]) {
      return;
    }

    this.loadingEventIds.update((ids) => ({ ...ids, [eventId]: true }));

    this.eventDisplayData
      .getEventData(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventData) => {
          this.eventData.update((currentData) => ({ ...currentData, [eventId]: eventData }));
          this.loadingEventIds.update((ids) => ({ ...ids, [eventId]: false }));
        },
        error: () => {
          this.eventData.update((currentData) => ({ ...currentData, [eventId]: null }));
          this.loadingEventIds.update((ids) => ({ ...ids, [eventId]: false }));
        },
      });
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
