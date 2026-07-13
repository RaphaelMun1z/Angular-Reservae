import { HttpClient, HttpResponse } from '@angular/common/http';
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
      .post(this.apiUrl.url(`${ORDER_PATH}/checkout`), request, {
        observe: 'response',
        responseType: 'text',
      })
      .pipe(map((response) => this.fromCheckoutResponse(response, request.eventId)));
  }

  getOrder(orderId: string): Observable<CheckoutOrder> {
    return this.http
      .get<OrderResponseDTO>(this.apiUrl.url(`${ORDER_PATH}/${orderId}`))
      .pipe(map((order) => this.fromOrderResponse(order)));
  }

  private fromCheckoutResponse(response: HttpResponse<string>, eventId: string): CheckoutOrder {
    const order = this.parseOrderSummary(response.body);

    return {
      id: order?.orderId ?? '',
      eventId,
      status: order?.status ?? (response.status === 202 ? 'PENDING' : null),
      totalAmount: order?.totalAmount ?? null,
      paymentUrl: order?.paymentUrl ?? null,
      items: [],
    };
  }

  private fromOrderSummary(order: OrderSummaryResponseDTO | null, eventId: string): CheckoutOrder {
    return {
      id: order?.orderId ?? '',
      eventId,
      status: order?.status ?? 'PENDING',
      totalAmount: order?.totalAmount ?? null,
      paymentUrl: order?.paymentUrl ?? null,
      items: [],
    };
  }

  private parseOrderSummary(body: string | null): OrderSummaryResponseDTO | null {
    if (!body?.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(body) as unknown;
      return this.isOrderSummaryResponse(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private isOrderSummaryResponse(value: unknown): value is OrderSummaryResponseDTO {
    return typeof value === 'object' && value !== null;
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
