import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { orderStatusLabel, ticketTypeLabel } from '../../shared/presentation-labels';
import { CheckoutApi, CheckoutOrder, CHECKOUT_API } from '../checkout/state/checkout.store';

@Component({
  selector: 'app-order-details',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetails implements OnInit {
  private readonly api = inject(CHECKOUT_API, { optional: true });
  private readonly route = inject(ActivatedRoute);
  readonly order = signal<CheckoutOrder | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');

    if (!orderId || !this.api) {
      this.error.set(!orderId ? 'Pedido nao identificado na rota.' : 'Integracao de pedidos nao configurada.');
      this.loading.set(false);
      return;
    }

    this.api
      .getOrder(orderId)
      .pipe(
        catchError(() => {
          this.error.set('Nao foi possivel carregar os detalhes deste pedido.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((order) => this.order.set(order));
  }

  statusLabel(status: string | null): string {
    return orderStatusLabel(status);
  }

  statusTone(status: string | null): string {
    if (status === 'CONFIRMED' || status === 'PAID' || status === 'APPROVED' || status === 'PAYMENT_APPROVED') return 'paid';
    if (status === 'AWAITING_PAYMENT' || status === 'PAYMENT_PENDING') return 'warning';
    if (status === 'CANCELLED' || status === 'FAILED' || status === 'PAYMENT_FAILED' || status === 'RESERVATION_FAILED') return 'danger';
    return 'processing';
  }

  statusIconPath(status: string | null): string {
    if (this.statusTone(status) === 'paid') return 'm5 12 4 4L19 6';
    if (this.statusTone(status) === 'danger') return 'm8 8 8 8M16 8l-8 8';
    return 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
  }

  eventMeta(order: CheckoutOrder): string {
    const date = this.formatDate(order.eventDate);
    const location = [order.venueName, [order.venueCity, order.venueState].filter(Boolean).join(', ')].filter(Boolean).join(' - ');
    return [date, location].filter(Boolean).join(' - ') || 'Detalhes do evento indisponiveis';
  }

  ticketTypeLabel(value: string | undefined): string {
    return ticketTypeLabel(value);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return 'Nao informado';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Nao informado';
  }
}
