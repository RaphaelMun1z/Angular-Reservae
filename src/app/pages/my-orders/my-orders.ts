import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import { CheckoutOrder } from '../checkout/state/checkout.store';
import { orderStatusLabel } from '../../shared/presentation-labels';
import { OrderStatus } from '../../core/models/order.model';
import { MyOrdersStore, OrderStatusFilter } from './state/my-orders.store';

@Component({
  selector: 'app-my-orders',
    imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader, EmptyStateComponent],
  providers: [MyOrdersStore],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  readonly store = inject(MyOrdersStore);

  readonly filters: readonly { value: OrderStatusFilter; label: string; iconPath: string }[] = [
    { value: 'ALL', label: 'Todos', iconPath: 'M4 5h16M4 12h16M4 19h16' },
    { value: 'PENDING', label: 'Pendentes', iconPath: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    { value: 'AWAITING_PAYMENT', label: 'Aguardando pagamento', iconPath: 'M3 6h18v12H3zM3 10h18M7 15h3' },
    { value: 'CONFIRMED', label: 'Confirmados', iconPath: 'm5 12 4 4L19 6' },
    { value: 'CANCELLED', label: 'Cancelados', iconPath: 'm8 8 8 8M16 8l-8 8' },
  ];

  ngOnInit(): void {
    this.store.loadOrders();
  }

  setFilter(status: OrderStatusFilter): void {
    this.store.setStatusFilter(status);
  }

  statusLabel(status: OrderStatus | string | null): string {
    return orderStatusLabel(status);
  }

  statusIconPath(status: OrderStatus | string | null): string {
    if (this.isPaid(status)) {
      return 'm5 12 4 4L19 6';
    }

    if (this.isFailed(status)) {
      return 'm8 8 8 8M16 8l-8 8';
    }

    if (this.isPaymentPending(status)) {
      return 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
    }

    return 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
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
    return order.eventTitle || 'Evento nao informado';
  }

  eventMeta(order: CheckoutOrder): string {
    const directEventDate = this.formatDate(order.eventDate);
    const directLocation = [order.venueName, [order.venueCity, order.venueState].filter(Boolean).join(', ')].filter(Boolean).join(' - ');

    return [directEventDate, directLocation].filter(Boolean).join(' - ') || 'Detalhes do evento indisponiveis';
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

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  hasTotal(order: CheckoutOrder): boolean {
    return typeof order.totalAmount === 'number';
  }

  isPaymentPending(status: OrderStatus | string | null): boolean {
    return status === 'AWAITING_PAYMENT' || status === 'PAYMENT_PENDING';
  }

  isPaid(status: OrderStatus | string | null): boolean {
    return status === 'CONFIRMED' || status === 'PAYMENT_APPROVED' || status === 'APPROVED' || status === 'PAID';
  }

  isFailed(status: OrderStatus | string | null): boolean {
    return status === 'RESERVATION_FAILED' ||
      status === 'RESERVATION_REJECTED' ||
      status === 'PAYMENT_FAILED' ||
      status === 'PAYMENT_NOT_CONFIRMED' ||
      status === 'PAYMENT_DECLINED' ||
      status === 'FAILED' ||
      status === 'CANCELLED' ||
      status === 'EXPIRED';
  }

  isEventDataUnavailable(order: CheckoutOrder): boolean {
    return !order.eventTitle && !order.eventDate && !order.venueName && !order.venueCity && !order.venueState;
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
