import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { CheckoutItem, CheckoutStore } from './state/checkout.store';

@Component({
  selector: 'app-checkout',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  readonly store = inject(CheckoutStore);
  readonly submitInProgress = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');

    if (eventId) {
      this.store.selectEvent(eventId);
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

      if (order.id) {
        this.store.startOrderPolling(order.id);
      }

      void this.router.navigateByUrl('/sucesso');
    });
  }

  changeQuantity(item: CheckoutItem, quantity: number): void {
    this.store.changeQuantity(item.sectorId, quantity, item.ticketType);
  }

  removeItem(item: CheckoutItem): void {
    this.store.removeItem(item.sectorId, item.ticketType);
  }

  formatCurrency(value: number | null | undefined): string {
    return typeof value === 'number'
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Indisponivel';
  }

  ticketTypeLabel(ticketType: CheckoutItem['ticketType']): string {
    return ticketType === 'HALF_TICKET_PRICE' ? 'Meia entrada' : 'Inteira';
  }

}
