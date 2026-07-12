import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckoutStore } from '../checkout/state/checkout.store';

@Component({
  selector: 'app-success',
  imports: [RouterLink],
  templateUrl: './success.html',
  styleUrl: './success.scss',
})
export class Success implements OnInit {
  readonly store = inject(CheckoutStore);

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
    } else {
      this.store.restorePendingOrder();
    }
  }

  statusMessage(): string {
    switch (this.store.status()) {
      case 'PENDING':
        return 'Seu pedido foi criado e a reserva ainda esta em processamento.';
      case 'AWAITING_PAYMENT':
        return 'Seu pedido aguarda a confirmacao do pagamento.';
      case 'CONFIRMED':
        return 'Sua compra foi confirmada. Os ingressos podem ser consultados na carteira.';
      case 'RESERVATION_FAILED':
        return 'Nao foi possivel reservar os ingressos selecionados.';
      case 'PAYMENT_FAILED':
        return 'O pagamento nao foi confirmado.';
      case 'CANCELLED':
        return 'O pedido foi cancelado.';
      default:
        return 'Consulte o status do pedido para acompanhar a compra.';
    }
  }
}
