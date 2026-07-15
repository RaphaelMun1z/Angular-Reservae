import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { CheckoutStore, type CheckoutItem } from './state/checkout.store';
import { ticketTypeLabel } from '../../shared/presentation-labels';
import { EventDisplayData, EventDisplayDataService } from '../../shared/event-display-data.service';

@Component({
  selector: 'app-checkout',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  readonly store = inject(CheckoutStore);
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

    const restoredOrderId = this.store.restorePendingOrder();

    if (restoredOrderId) {
      this.store.startOrderPolling(restoredOrderId);
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
      void this.router.navigateByUrl('/order-created');
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

  eventName(): string {
    const eventId = this.store.eventId();

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
}
