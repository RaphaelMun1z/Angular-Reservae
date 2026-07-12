import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CheckoutRequestDTO, OrderResponseDTO, OrderSummaryResponseDTO } from '../models/order.model';
import { ApiUrlService } from './api-url.service';
import { CheckoutApi, CheckoutOrder } from '../../pages/checkout/state/checkout.store';

const ORDER_PATH = '/order-service/api/orders/v1';

@Injectable({
  providedIn: 'root',
})
export class HttpCheckoutApi implements CheckoutApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  startCheckout(request: CheckoutRequestDTO): Observable<CheckoutOrder> {
    return this.http
      .post<OrderSummaryResponseDTO>(this.apiUrl.url(`${ORDER_PATH}/checkout`), request)
      .pipe(map((order) => this.fromOrderSummary(order, request.eventId)));
  }

  getOrder(orderId: string): Observable<CheckoutOrder> {
    return this.http
      .get<OrderResponseDTO>(this.apiUrl.url(`${ORDER_PATH}/${orderId}`))
      .pipe(map((order) => this.fromOrderResponse(order)));
  }

  private fromOrderSummary(order: OrderSummaryResponseDTO, eventId: string): CheckoutOrder {
    return {
      id: order.orderId ?? '',
      eventId,
      status: order.status ?? null,
      totalAmount: order.totalAmount ?? null,
      paymentUrl: order.paymentUrl ?? null,
      items: [],
    };
  }

  private fromOrderResponse(order: OrderResponseDTO): CheckoutOrder {
    return {
      id: order.orderId ?? '',
      eventId: null,
      status: order.status ?? null,
      totalAmount: order.totalAmount ?? null,
      paymentUrl: order.paymentUrl ?? null,
      items: order.itens ?? [],
    };
  }
}
