import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { CheckoutItem, CheckoutStore } from '../checkout/state/checkout.store';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, SiteFooter, SiteNavbar],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  readonly checkoutStore = inject(CheckoutStore);
  private readonly router = inject(Router);

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
    return ticketType === 'HALF_TICKET_PRICE' ? 'Meia' : 'Inteira';
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }
}
