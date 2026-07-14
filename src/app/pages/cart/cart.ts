import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { CheckoutItem, CheckoutStore } from '../checkout/state/checkout.store';
import { EventListItem, EventStore } from '../events/state/event.store';
import { ticketTypeLabel } from '../../shared/presentation-labels';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, SiteFooter, SiteNavbar],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  readonly checkoutStore = inject(CheckoutStore);
  readonly eventStore = inject(EventStore);
  private readonly router = inject(Router);

  readonly detailsLoading = computed(() => this.checkoutStore.hasItems() && this.eventStore.loading());
  readonly detailsError = computed(() => (this.checkoutStore.hasItems() ? this.eventStore.error() : null));

  ngOnInit(): void {
    const eventId = this.checkoutStore.eventId();

    if (!eventId || !this.checkoutStore.hasItems()) {
      return;
    }

    if (this.eventStore.selectedEvent()?.id !== eventId) {
      this.eventStore.loadEvent(eventId);
    }

    if (this.eventStore.sectors().length === 0) {
      this.eventStore.loadSectors(eventId);
    }
  }

  changeQuantity(item: CheckoutItem, quantity: number): void {
    this.checkoutStore.changeQuantity(item.sectorId, quantity, item.ticketType);
  }

  removeItem(item: CheckoutItem): void {
    this.checkoutStore.removeItem(item.sectorId, item.ticketType);
  }

  clearCart(): void {
    this.checkoutStore.clearSelection();
  }

  continueBuying(): void {
    const eventId = this.checkoutStore.eventId();
    void this.router.navigate(eventId ? ['/selecionar-setor', eventId] : ['/shows']);
  }

  continueToCheckout(): void {
    const eventId = this.checkoutStore.eventId();
    void this.router.navigate(eventId ? ['/checkout', eventId] : ['/checkout']);
  }

  ticketTypeLabel(ticketType: CheckoutItem['ticketType']): string {
    return ticketTypeLabel(ticketType);
  }

  eventName(): string {
    return this.eventStore.selectedEvent()?.name || 'Evento em carregamento';
  }

  eventMeta(): string {
    const event = this.eventStore.selectedEvent();
    const date = this.formatDate(event?.date);
    const location = this.eventLocation(event);

    if (date && location) {
      return `${date} - ${location}`;
    }

    return date || location || 'Detalhes do evento em carregamento';
  }

  sectorName(item: CheckoutItem): string {
    const sector = this.eventStore.sectors().find((currentSector) => currentSector.id === item.sectorId);
    return sector?.name || item.sectorName || `Setor ${item.sectorId}`;
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  private eventLocation(event: EventListItem | null | undefined): string {
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
