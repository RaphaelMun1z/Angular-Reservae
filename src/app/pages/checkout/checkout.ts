import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { CheckoutStore, type CheckoutItem } from './state/checkout.store';
import { TicketType } from '../../core/models/event-catalog.model';
import { ticketTypeLabel } from '../../shared/presentation-labels';
import { EventDisplayData, EventDisplayDataService } from '../../shared/event-display-data.service';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-checkout',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  readonly store = inject(CheckoutStore);
  readonly authStore = inject(AuthStore);
  readonly userInitials = computed(() =>
    this.authStore
      .displayName()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
  );
  readonly submitInProgress = signal(false);
  readonly eventData = signal<EventDisplayData | null>(null);
  readonly eventDetailsLoading = signal(false);
  readonly eventDetailsError = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventDisplayData = inject(EventDisplayDataService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');

    if (eventId) {
      this.store.selectEvent(eventId);
    }

    const selectedEventId = this.store.eventId();
    if (selectedEventId) {
      this.loadEventData(selectedEventId);
    }

  }

  payNow(): void {
    if (this.submitInProgress() || this.store.loading()) {
      return;
    }

    this.submitInProgress.set(true);

    this.store.createCheckout().subscribe((order) => {
      this.submitInProgress.set(false);

      if (!order) {
        return;
      }

      if (!order.id) {
        this.store.setError('Pedido criado, mas o backend nao retornou um identificador valido.');
        return;
      }

      this.store.startOrderPolling(order.id);
      void this.router.navigateByUrl(`/order-track?orderId=${encodeURIComponent(order.id)}`);
    });
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  ticketTypeLabel(ticketType: CheckoutItem['ticketType']): string {
    return ticketTypeLabel(ticketType);
  }

  decreaseQuantity(item: CheckoutItem): void {
    if (item.quantity <= 1) {
      return;
    }

    this.store.changeQuantity(item.sectorId, item.quantity - 1, item.ticketType);
  }

  increaseQuantity(item: CheckoutItem): void {
    this.store.changeQuantity(item.sectorId, item.quantity + 1, item.ticketType);
  }

  changeTicketType(item: CheckoutItem, ticketType: TicketType): void {
    if (item.ticketType === ticketType) {
      return;
    }

    const sector = this.eventData()?.sectors.find((currentSector) => currentSector.id === item.sectorId);
    const unitPrice = ticketType === 'HALF_TICKET_PRICE' ? sector?.halfPrice : sector?.basePrice;

    if (unitPrice === null || unitPrice === undefined) {
      this.store.setError('Preco indisponivel para o tipo de ingresso selecionado.');
      return;
    }

    this.store.changeTicketType(item.sectorId, item.ticketType, ticketType, unitPrice);
  }

  removeItem(item: CheckoutItem): void {
    this.store.removeItem(item.sectorId, item.ticketType);
  }

  continueShopping(): void {
    const eventId = this.store.eventId();
    void this.router.navigate(eventId ? ['/selecionar-setor', eventId] : ['/shows']);
  }

  eventName(): string {
    const eventId = this.store.eventId();

    if (!eventId) {
      return 'Evento nao informado';
    }

    return this.eventData()?.event?.name || (this.eventDetailsLoading() ? 'Carregando evento...' : 'Evento nao identificado');
  }

  eventDate(): string {
    const event = this.eventData()?.event;
    return this.formatDate(event?.date);
  }

  eventTime(): string {
    const value = this.eventData()?.event?.date;

    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  eventLocation(): string {
    return this.formatEventLocation(this.eventData()?.event);
  }

  sectorName(item: CheckoutItem): string {
    const sector = this.eventData()?.sectors.find((currentSector) => currentSector.id === item.sectorId);
    return sector?.name || item.sectorName || `Setor ${item.sectorId}`;
  }

  private loadEventData(eventId: string): void {
    if (this.eventData()?.event?.id === eventId || this.eventDetailsLoading()) {
      return;
    }

    this.eventDetailsLoading.set(true);
    this.eventDetailsError.set(false);

    this.eventDisplayData
      .getEventWithAvailability(eventId)
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

  private formatEventLocation(event: EventDisplayData['event'] | undefined): string {
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
    });
  }
}
