import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import confetti from 'canvas-confetti';
import { OrderItemResponseDTO, OrderStatus } from '../../../../core/models/order.model';
import { SiteFooter } from '../../../../layouts/site-footer/site-footer';
import { SiteNavbar } from '../../../../layouts/site-navbar/site-navbar';
import { CheckoutItem, CheckoutStore } from '../../../checkout/state/checkout.store';
import { orderStatusLabel as friendlyOrderStatusLabel, ticketTypeLabel } from '../../../../shared/presentation/presentation-labels';
import { LucideAngularModule } from 'lucide-angular';

type StatusTone = 'info' | 'warning' | 'success' | 'danger';
type TimelineState = 'done' | 'current' | 'pending' | 'error';

interface TimelineStep {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly state: TimelineState;
}

interface DisplayItem {
  readonly sector: string;
  readonly ticketType: string;
  readonly quantity: number;
  readonly unitPrice: number | null;
  readonly subtotal: number | null;
}

@Component({
  selector: 'app-order-created',
  imports: [RouterLink, SiteFooter, SiteNavbar, LucideAngularModule],
  templateUrl: './order-created.html',
  styleUrl: './order-created.scss',
})
export class OrderCreated implements OnInit {
  readonly store = inject(CheckoutStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryOrderId = signal<string | null>(null);
  readonly paymentSessionId = signal<string | null>(null);
  readonly detailsExpanded = signal(true);
  private confettiLaunched = false;

  constructor() {
    effect(() => {
      if (this.isPaymentConfirmed() && !this.store.loading() && !this.store.error()) {
        queueMicrotask(() => this.launchSuccessConfetti());
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const orderId = this.normalizeQueryParam(params.get('orderId'));
      const sessionId = this.normalizeQueryParam(params.get('sessionId'));

      this.queryOrderId.set(orderId);
      this.paymentSessionId.set(sessionId);

      if (orderId) {
        this.store.startOrderPolling(orderId);
        return;
      }

      void this.router.navigateByUrl('/checkout');
    });
  }

  retry(): void {
    const orderId = this.queryOrderId();

    if (orderId) {
      this.store.startOrderPolling(orderId);
      return;
    }

    void this.router.navigateByUrl('/checkout');
  }

  toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  displayOrderId(): string | null {
    return this.queryOrderId();
  }

  statusTone(): StatusTone {
    switch (this.store.status()) {
      case 'CONFIRMED':
      case 'PAYMENT_APPROVED':
      case 'APPROVED':
      case 'PAID':
        return 'success';
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return 'warning';
      case 'RESERVATION_FAILED':
      case 'RESERVATION_REJECTED':
      case 'PAYMENT_FAILED':
      case 'PAYMENT_NOT_CONFIRMED':
      case 'PAYMENT_DECLINED':
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'danger';
      default:
        return 'info';
    }
  }

  isPaymentConfirmed(): boolean {
    return this.store.status() === 'CONFIRMED' ||
      this.store.status() === 'PAYMENT_APPROVED' ||
      this.store.status() === 'APPROVED' ||
      this.store.status() === 'PAID';
  }

  orderStatusLabel(): string {
    const status = this.store.status() as string | null;

    switch (status) {
      case 'PENDING':
        return 'Reserva em processamento';
      case 'PROCESSING':
        return 'Pedido em processamento';
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return this.store.paymentUrl() ? 'Pagamento disponivel' : 'Reserva confirmada';
      case 'RESERVATION_CONFIRMED':
      case 'RESERVED':
        return 'Reserva confirmada';
      case 'CONFIRMED':
      case 'PAYMENT_APPROVED':
      case 'APPROVED':
      case 'PAID':
        return 'Pagamento confirmado';
      case 'RESERVATION_FAILED':
      case 'RESERVATION_REJECTED':
        return 'Reserva nao concluida';
      case 'PAYMENT_FAILED':
      case 'PAYMENT_NOT_CONFIRMED':
      case 'PAYMENT_DECLINED':
      case 'FAILED':
        return 'Pagamento nao confirmado';
      case 'CANCELLED':
        return 'Pedido cancelado';
      case 'EXPIRED':
        return 'Pedido expirado';
      default:
        return friendlyOrderStatusLabel(this.store.status());
    }
  }

  timelineSteps(): readonly TimelineStep[] {
    const status = this.store.status();
    const paymentAvailable = Boolean(this.store.paymentUrl());
    const currentIndex = this.currentTimelineIndex(status, paymentAvailable);
    const errorIndex = this.errorTimelineIndex(status);

    return [
      {
        key: 'created',
        title: 'Pedido criado',
        description: 'Recebemos sua solicitacao de compra.',
        state: this.timelineState(0, currentIndex, errorIndex),
      },
      {
        key: 'reservation-processing',
        title: 'Reserva em processamento',
        description: 'Estamos validando a disponibilidade dos ingressos.',
        state: this.timelineState(1, currentIndex, errorIndex),
      },
      {
        key: 'reservation-confirmed',
        title: 'Reserva confirmada',
        description: 'Os ingressos foram reservados para este pedido.',
        state: this.timelineState(2, currentIndex, errorIndex),
      },
      {
        key: 'payment-available',
        title: 'Pagamento disponivel',
        description: 'O link seguro de pagamento fica disponivel nesta etapa.',
        state: this.timelineState(3, currentIndex, errorIndex),
      },
      {
        key: 'payment-confirmed',
        title: 'Pagamento confirmado',
        description: 'A confirmacao do pagamento libera a geracao dos ingressos.',
        state: this.timelineState(4, currentIndex, errorIndex),
      },
      {
        key: 'tickets-generated',
        title: 'Ingressos gerados',
        description: 'Os ingressos ficam disponiveis em Meus ingressos.',
        state: this.timelineState(5, currentIndex, errorIndex),
      },
    ];
  }

  timelineProgress(): string {
    const steps = this.timelineSteps();
    const currentIndex = steps.findIndex((step) => step.state === 'current');
    const isComplete = steps.length > 0 && steps.every((step) => step.state === 'done');
    const normalizedIndex = isComplete ? steps.length - 1 : Math.max(currentIndex, 0);
    return `${(normalizedIndex / 5) * 100}%`;
  }

  displayItems(): readonly DisplayItem[] {
    const orderItems = this.store.order()?.items ?? [];

    if (orderItems.length > 0) {
      return orderItems.map((item) => this.fromOrderItem(item));
    }

    return this.store.items().map((item) => this.fromCheckoutItem(item));
  }

  hasEventDetails(): boolean {
    const order = this.store.order();
    return Boolean(order?.eventTitle || order?.eventDate || order?.venueName || order?.venueCity || order?.venueState);
  }

  eventName(): string {
    return this.store.order()?.eventTitle || 'Evento nao informado';
  }

  eventMeta(): string {
    const order = this.store.order();
    const date = this.formatDate(order?.eventDate);
    const cityState = [order?.venueCity, order?.venueState].filter(Boolean).join(', ');
    const location = [order?.venueName, cityState].filter(Boolean).join(' - ');

    if (date && location) {
      return `${date} - ${location}`;
    }

    return date || location || 'Detalhes do evento indisponiveis';
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  private currentTimelineIndex(status: OrderStatus | null, paymentAvailable: boolean): number {
    const normalizedStatus = status as string | null;

    switch (normalizedStatus) {
      case 'PENDING':
      case 'PROCESSING':
        return 1;
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return paymentAvailable ? 3 : 2;
      case 'RESERVATION_CONFIRMED':
      case 'RESERVED':
        return 2;
      case 'CONFIRMED':
      case 'PAYMENT_APPROVED':
      case 'APPROVED':
      case 'PAID':
        return 5;
      case 'RESERVATION_FAILED':
      case 'RESERVATION_REJECTED':
        return 1;
      case 'PAYMENT_FAILED':
      case 'PAYMENT_NOT_CONFIRMED':
      case 'PAYMENT_DECLINED':
      case 'FAILED':
        return 4;
      case 'CANCELLED':
        return 3;
      case 'EXPIRED':
        return 3;
      default:
        return 0;
    }
  }

  private errorTimelineIndex(status: OrderStatus | null): number | null {
    const normalizedStatus = status as string | null;

    switch (normalizedStatus) {
      case 'RESERVATION_FAILED':
      case 'RESERVATION_REJECTED':
        return 1;
      case 'PAYMENT_FAILED':
      case 'PAYMENT_NOT_CONFIRMED':
      case 'PAYMENT_DECLINED':
      case 'FAILED':
        return 4;
      case 'CANCELLED':
        return 3;
      case 'EXPIRED':
        return 3;
      default:
        return null;
    }
  }

  private timelineState(index: number, currentIndex: number, errorIndex: number | null): TimelineState {
    if (errorIndex === index) {
      return 'error';
    }

    if (index < currentIndex || (currentIndex === 5 && index <= currentIndex)) {
      return 'done';
    }

    if (index === currentIndex) {
      return 'current';
    }

    return 'pending';
  }

  private fromOrderItem(item: OrderItemResponseDTO): DisplayItem {
    const quantity = item.quantity ?? 1;
    const subtotal = item.subtotal ?? (item.appliedPrice !== undefined ? item.appliedPrice * quantity : null);

    return {
      sector: item.sectorName || 'Setor nao informado',
      ticketType: this.ticketTypeLabel(item.ticketType),
      quantity,
      unitPrice: item.appliedPrice ?? (subtotal !== null ? subtotal / quantity : null),
      subtotal,
    };
  }

  private fromCheckoutItem(item: CheckoutItem): DisplayItem {
    return {
      sector: item.sectorName || 'Setor nao informado',
      ticketType: this.ticketTypeLabel(item.ticketType),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    };
  }

  private ticketTypeLabel(ticketType: CheckoutItem['ticketType'] | undefined): string {
    return ticketTypeLabel(ticketType);
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

  private normalizeQueryParam(value: string | null): string | null {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : null;
  }

  private launchSuccessConfetti(): void {
    if (this.confettiLaunched || typeof window === 'undefined') {
      return;
    }

    this.confettiLaunched = true;

    const defaults = {
      colors: ['#00e676', '#a8ffd0', '#ff624d', '#ffffff'],
      disableForReducedMotion: true,
      ticks: 220,
      zIndex: 1000,
    };

    void confetti({
      ...defaults,
      particleCount: 90,
      spread: 72,
      origin: { x: 0.5, y: 0.28 },
    });

    window.setTimeout(() => {
      void confetti({
        ...defaults,
        particleCount: 55,
        angle: 60,
        spread: 55,
        origin: { x: 0.12, y: 0.42 },
      });

      void confetti({
        ...defaults,
        particleCount: 55,
        angle: 120,
        spread: 55,
        origin: { x: 0.88, y: 0.42 },
      });
    }, 180);
  }
}
