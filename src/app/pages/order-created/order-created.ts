import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { CheckoutStore } from '../checkout/state/checkout.store';

@Component({
  selector: 'app-order-created',
  imports: [RouterLink, SiteFooter, SiteNavbar, SkeletonLoader],
  templateUrl: './order-created.html',
  styleUrl: './order-created.scss',
})
export class OrderCreated implements OnInit {
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
      return;
    }

    this.store.restorePendingOrder();
  }

  orderStatusLabel(): string {
    switch (this.store.status()) {
      case 'PENDING':
        return 'Processando envio';
      case 'AWAITING_PAYMENT':
        return 'Aguardando pagamento';
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
        return 'Estamos finalizando a geracao do link e enviando a mensagem para o e-mail da sua conta.';
      case 'AWAITING_PAYMENT':
        return 'A reserva fica ativa por 30 minutos. Conclua o pagamento dentro desse prazo para manter seus ingressos.';
      case 'CONFIRMED':
        return 'Pagamento confirmado. Seus ingressos ficarao disponiveis na area Meus ingressos.';
      case 'RESERVATION_FAILED':
      case 'PAYMENT_FAILED':
      case 'CANCELLED':
        return 'Nao foi possivel concluir este pedido. Voce pode consultar novamente ou falar com o suporte.';
      default:
        return 'Voce tem 30 minutos para realizar o pagamento. Depois disso, a reserva sera cancelada automaticamente.';
    }
  }
}
