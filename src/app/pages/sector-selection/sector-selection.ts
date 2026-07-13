import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { CheckoutStore } from '../checkout/state/checkout.store';
import { EventSector, EventStore } from '../events/state/event.store';
import { TicketType } from '../../core/models/event-catalog.model';

@Component({
  selector: 'app-sector-selection',
  imports: [RouterLink, SiteFooter, SiteNavbar, SkeletonLoader],
  templateUrl: './sector-selection.html',
  styleUrl: './sector-selection.scss',
})
export class SectorSelection implements OnInit {
  readonly checkoutStore = inject(CheckoutStore);
  readonly eventStore = inject(EventStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quantities = signal<Record<string, number>>({});
  private readonly ticketTypes = signal<Record<string, TicketType>>({});
  readonly selectedSectorId = signal<string | null>(null);
  readonly cartExpanded = signal(false);

  readonly checkoutUrl = computed(() => {
    const eventId = this.checkoutStore.eventId();
    return eventId ? ['/checkout', eventId] : ['/checkout'];
  });

  readonly selectedSector = computed(() => {
    const selectedSectorId = this.selectedSectorId();
    return this.eventStore.sectors().find((sector) => sector.id === selectedSectorId) ?? null;
  });

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');

    if (!eventId) {
      return;
    }

    this.checkoutStore.selectEvent(eventId);
    this.eventStore.loadEvent(eventId);
    this.eventStore.loadSectors(eventId);
  }

  quantity(sectorId: string): number {
    return this.quantities()[sectorId] ?? 1;
  }

  ticketType(sectorId: string): TicketType {
    return this.ticketTypes()[sectorId] ?? 'FULL_TICKET_PRICE';
  }

  setTicketType(sectorId: string, ticketType: TicketType): void {
    this.ticketTypes.update((ticketTypes) => ({ ...ticketTypes, [sectorId]: ticketType }));
  }

  selectSector(sector: EventSector): void {
    if (sector.availableQuantity === 0) {
      return;
    }

    this.selectedSectorId.set(sector.id);
  }

  increment(sector: EventSector): void {
    this.setQuantity(sector, this.quantity(sector.id) + 1);
  }

  decrement(sector: EventSector): void {
    this.setQuantity(sector, this.quantity(sector.id) - 1);
  }

  setQuantity(sector: EventSector, quantity: number): void {
    const maxQuantity = sector.availableQuantity ?? Number.MAX_SAFE_INTEGER;
    const nextQuantity = Math.min(Math.max(1, quantity), maxQuantity);
    this.quantities.update((quantities) => ({ ...quantities, [sector.id]: nextQuantity }));
  }

  addSector(sector: EventSector): void {
    const ticketType = this.ticketType(sector.id);
    const unitPrice = ticketType === 'HALF_TICKET_PRICE' ? sector.halfPrice : sector.basePrice;

    if (!unitPrice && unitPrice !== 0) {
      this.checkoutStore.setError('Preco indisponivel para o setor selecionado.');
      return;
    }

    this.checkoutStore.addItem({
      sectorId: sector.id,
      sectorName: sector.name,
      quantity: this.quantity(sector.id),
      ticketType,
      unitPrice,
    });
  }

  selectedQuantityForSector(sectorId: string): number {
    return this.checkoutStore
      .items()
      .filter((item) => item.sectorId === sectorId)
      .reduce((total, item) => total + item.quantity, 0);
  }

  availabilityLabel(sector: EventSector): string {
    if (sector.availableQuantity === 0) {
      return 'Esgotado';
    }

    if (sector.availableQuantity === null || sector.availableQuantity === undefined) {
      return 'Disponibilidade aberta';
    }

    return `${sector.availableQuantity} disponiveis`;
  }

  ticketTypeLabel(ticketType: TicketType): string {
    return ticketType === 'HALF_TICKET_PRICE' ? 'Meia' : 'Inteira';
  }

  removeCartItem(sectorId: string, ticketType: TicketType): void {
    this.checkoutStore.removeItem(sectorId, ticketType);

    if (!this.checkoutStore.hasItems()) {
      this.cartExpanded.set(false);
    }
  }

  toggleCartDetails(): void {
    this.cartExpanded.update((expanded) => !expanded);
  }

  continueToCheckout(): void {
    void this.router.navigate(this.checkoutUrl());
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }
}
