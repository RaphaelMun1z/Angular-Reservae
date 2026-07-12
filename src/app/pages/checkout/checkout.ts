import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { CheckoutItem, CheckoutStore } from './state/checkout.store';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, UserMenu],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  readonly store = inject(CheckoutStore);
  readonly submitInProgress = signal(false);
  private readonly route = inject(ActivatedRoute);

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

      this.store.startOrderPolling(order.id);

      if (!this.isHttpUrl(order.paymentUrl)) {
        this.store.setPaymentRedirectError();
        return;
      }

      this.redirectToPayment(order.paymentUrl);
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

  redirectToPayment(paymentUrl: string): void {
    window.location.assign(paymentUrl);
  }

  private isHttpUrl(value: string | null): value is string {
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
