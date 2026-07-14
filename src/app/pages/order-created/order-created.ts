import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import confetti from 'canvas-confetti';
import { OrderItemResponseDTO, OrderStatus } from '../../core/models/order.model';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { CheckoutItem, CheckoutStore } from '../checkout/state/checkout.store';
import { ticketTypeLabel } from '../../shared/presentation-labels';
import { EventDisplayData, EventDisplayDataService } from '../../shared/event-display-data.service';

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
  imports: [RouterLink, SiteFooter, SiteNavbar, SkeletonLoader],
  templateUrl: './order-created.html',
  styleUrl: './order-created.scss',
})
export class OrderCreated implements OnInit {
  readonly store = inject(CheckoutStore);
  private readonly eventDisplayData = inject(EventDisplayDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventData = signal<EventDisplayData | null>(null);
  readonly eventDetailsLoading = signal(false);
  readonly eventDetailsError = signal(false);
  private confettiLaunched = false;

  constructor() {
    effect(() => {
      const eventId = this.store.order()?.eventId ?? this.store.eventId();

      if (eventId) {
        queueMicrotask(() => this.loadEventData(eventId));
      }
    });

    effect(() => {
      if (this.isPaymentConfirmed() && !this.store.loading() && !this.store.error()) {
        queueMicrotask(() => this.launchSuccessConfetti());
      }
    });
  }

  ngOnInit(): void {
    const restoredOrderId = this.store.restorePendingOrder();
    const orderId = restoredOrderId ?? this.store.orderId();

    if (orderId && !this.store.succeeded() && !this.store.failed()) {
      this.store.startOrderPolling(orderId);
    }
  }

  retry(): void {
    const orderId = this.store.orderId();

    if (orderId) {
      this.store.loadOrder(orderId);
      this.store.startOrderPolling(orderId);
      return;
    }

    this.store.restorePendingOrder();
  }

  statusTone(): StatusTone {
    switch (this.store.status()) {
      case 'CONFIRMED':
        return 'success';
      case 'AWAITING_PAYMENT':
        return 'warning';
      case 'RESERVATION_FAILED':
      case 'PAYMENT_FAILED':
      case 'CANCELLED':
        return 'danger';
      default:
        return 'info';
    }
  }

  statusIconPath(): string {
    switch (this.statusTone()) {
      case 'success':
        return 'M20 6 9 17l-5-5';
      case 'danger':
        return 'M18 6 6 18M6 6l12 12';
      case 'warning':
        return 'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z';
      default:
        return 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
    }
  }

  isPaymentConfirmed(): boolean {
    return this.store.status() === 'CONFIRMED';
  }

  orderStatusLabel(): string {
    switch (this.store.status()) {
      case 'PENDING':
        return 'Reserva em processamento';
      case 'AWAITING_PAYMENT':
        return this.store.paymentUrl() ? 'Pagamento disponivel' : 'Reserva confirmada';
      case 'CONFIRMED':
        return 'Pagamento confirmado';
      case 'RESERVATION_FAILED':
        return 'Reserva nao concluida';
      case 'PAYMENT_FAILED':
        return 'Pagamento nao confirmado';
      case 'CANCELLED':
        return 'Pedido cancelado';
      default:
        return 'Pedido criado';
    }
  }

  orderStatusDescription(): string {
    switch (this.store.status()) {
      case 'PENDING':
        return 'Recebemos seu pedido e estamos validando a reserva dos ingressos selecionados.';
      case 'AWAITING_PAYMENT':
        return this.store.paymentUrl()
          ? 'Sua reserva foi confirmada. Acesse o link seguro para finalizar o pagamento.'
          : 'Sua reserva foi confirmada e o pagamento esta sendo preparado. Atualize o status em alguns instantes.';
      case 'CONFIRMED':
        return 'Seu pedido foi confirmado com sucesso. Seus ingressos serao disponibilizados em breve em Meus ingressos.';
      case 'RESERVATION_FAILED':
        return 'Nao foi possivel reservar os ingressos. Voce pode voltar aos eventos e selecionar ingressos novamente.';
      case 'PAYMENT_FAILED':
        return 'O pagamento nao foi confirmado. Verifique o pedido ou tente escolher os ingressos novamente.';
      case 'CANCELLED':
        return 'Este pedido foi cancelado. Para continuar, escolha os ingressos novamente.';
      default:
        return 'Estamos preparando as informacoes do seu pedido. Atualize o status se a pagina nao mudar automaticamente.';
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

  displayItems(): readonly DisplayItem[] {
    const orderItems = this.store.order()?.items ?? [];

    if (orderItems.length > 0) {
      return orderItems.map((item) => this.fromOrderItem(item));
    }

    return this.store.items().map((item) => this.fromCheckoutItem(item));
  }

  eventName(): string {
    const eventId = this.store.order()?.eventId ?? this.store.eventId();

    if (!eventId) {
      return 'Evento nao informado';
    }

    return this.eventData()?.event?.name || (this.eventDetailsLoading() ? 'Carregando evento...' : 'Evento nao identificado');
  }

  eventMeta(): string {
    const event = this.eventData()?.event;
    const date = this.formatDate(event?.date);
    const location = this.eventLocation(event);

    if (date && location) {
      return `${date} - ${location}`;
    }

    return date || location || (this.eventDetailsError() ? 'Detalhes do evento indisponiveis' : 'Detalhes do evento em carregamento');
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  private currentTimelineIndex(status: OrderStatus | null, paymentAvailable: boolean): number {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'AWAITING_PAYMENT':
        return paymentAvailable ? 3 : 2;
      case 'CONFIRMED':
        return 5;
      case 'RESERVATION_FAILED':
        return 1;
      case 'PAYMENT_FAILED':
        return 4;
      case 'CANCELLED':
        return 3;
      default:
        return 0;
    }
  }

  private errorTimelineIndex(status: OrderStatus | null): number | null {
    switch (status) {
      case 'RESERVATION_FAILED':
        return 1;
      case 'PAYMENT_FAILED':
        return 4;
      case 'CANCELLED':
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
      sector: this.sectorName(item.sectorId),
      ticketType: this.ticketTypeLabel(item.ticketType),
      quantity,
      unitPrice: item.appliedPrice ?? (subtotal !== null ? subtotal / quantity : null),
      subtotal,
    };
  }

  private fromCheckoutItem(item: CheckoutItem): DisplayItem {
    return {
      sector: this.sectorName(item.sectorId, item.sectorName),
      ticketType: this.ticketTypeLabel(item.ticketType),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    };
  }

  private ticketTypeLabel(ticketType: CheckoutItem['ticketType'] | undefined): string {
    return ticketTypeLabel(ticketType);
  }

  private sectorName(sectorId: string | undefined, fallback?: string): string {
    if (!sectorId) {
      return fallback || 'Setor nao informado';
    }

    const sector = this.eventData()?.sectors.find((currentSector) => currentSector.id === sectorId);
    return sector?.name || fallback || (this.eventDetailsLoading() ? 'Carregando setor...' : `Setor ${sectorId}`);
  }

  private loadEventData(eventId: string): void {
    if (this.eventData()?.event?.id === eventId || this.eventDetailsLoading()) {
      return;
    }

    this.eventDetailsLoading.set(true);
    this.eventDetailsError.set(false);

    this.eventDisplayData
      .getEventData(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventData) => {
          this.eventData.set(eventData);
          this.eventDetailsLoading.set(false);
        },
        error: () => {
          this.eventData.set(null);
          this.eventDetailsLoading.set(false);
          this.eventDetailsError.set(true);
        },
      });
  }

  private eventLocation(event: EventDisplayData['event'] | undefined): string {
    const cityState = [event?.city, event?.state].filter(Boolean).join(', ');
    return [event?.venueName, cityState].filter(Boolean).join(' - ');
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
