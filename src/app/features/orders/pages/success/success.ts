import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../../../layouts/site-footer/site-footer';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { CheckoutStore } from '../../../checkout/state/checkout.store';
import { orderStatusLabel } from '../../../../shared/presentation/presentation-labels';

@Component({
  selector: 'app-success',
  imports: [RouterLink, SiteFooter, SkeletonLoader],
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
        return 'Seu pedido foi criado. Enviaremos a confirmacao e o link de pagamento por e-mail assim que o processamento terminar.';
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return 'Seu pedido aguarda pagamento. Confira seu e-mail para acessar a URL segura de pagamento.';
      case 'CONFIRMED':
      case 'PAYMENT_APPROVED':
      case 'APPROVED':
      case 'PAID':
        return 'Sua compra foi confirmada. Os ingressos podem ser consultados na carteira.';
      case 'RESERVATION_FAILED':
      case 'RESERVATION_REJECTED':
        return 'Nao foi possivel reservar os ingressos selecionados.';
      case 'PAYMENT_FAILED':
      case 'PAYMENT_NOT_CONFIRMED':
      case 'PAYMENT_DECLINED':
      case 'FAILED':
        return 'O pagamento nao foi confirmado.';
      case 'CANCELLED':
        return 'O pedido foi cancelado.';
      case 'EXPIRED':
        return 'O prazo deste pedido expirou.';
      default:
        return 'Seu pedido foi recebido. Confira seu e-mail para acompanhar a confirmacao e o link de pagamento.';
    }
  }

  statusLabel(): string {
    return orderStatusLabel(this.store.status());
  }
}
