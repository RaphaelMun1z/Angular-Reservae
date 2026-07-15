import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpCheckoutApi } from './http-checkout.api';

describe('HttpCheckoutApi', () => {
  let api: HttpCheckoutApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpCheckoutApi],
    });

    api = TestBed.inject(HttpCheckoutApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create checkout using the order-service contract', () => {
    const request = {
      userId: 'user-1',
      eventId: 'event-1',
      items: [{ sectorId: 'sector-1', ticketType: 'FULL_TICKET_PRICE' as const, quantity: 2 }],
    };

    api.startCheckout(request).subscribe((order) => {
      expect(order.id).toBe('order-1');
      expect(order.status).toBe('AWAITING_PAYMENT');
      expect(order.totalAmount).toBe(100);
    });

    const req = http.expectOne('http://localhost:8765/order-service/api/orders/v1/checkout');
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('text');
    expect(req.request.body).toEqual(request);
    req.flush(JSON.stringify({ orderId: 'order-1', status: 'AWAITING_PAYMENT', totalAmount: 100 }));
  });

  it('should accept async checkout responses without a body', () => {
    const request = {
      userId: 'user-1',
      eventId: 'event-1',
      items: [{ sectorId: 'sector-1', ticketType: 'FULL_TICKET_PRICE' as const, quantity: 2 }],
    };

    api.startCheckout(request).subscribe((order) => {
      expect(order.id).toBe('');
      expect(order.status).toBe('PENDING');
      expect(order.paymentUrl).toBeNull();
    });

    const req = http.expectOne('http://localhost:8765/order-service/api/orders/v1/checkout');
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('text');
    req.flush('', { status: 202, statusText: 'Accepted' });
  });

  it('should accept async checkout responses with plain text body', () => {
    const request = {
      userId: 'user-1',
      eventId: 'event-1',
      items: [{ sectorId: 'sector-1', ticketType: 'FULL_TICKET_PRICE' as const, quantity: 2 }],
    };

    api.startCheckout(request).subscribe((order) => {
      expect(order.id).toBe('');
      expect(order.status).toBe('PENDING');
      expect(order.paymentUrl).toBeNull();
    });

    const req = http.expectOne('http://localhost:8765/order-service/api/orders/v1/checkout');
    expect(req.request.method).toBe('POST');
    req.flush('Pedido criado e enviado para processamento.', { status: 202, statusText: 'Accepted' });
  });

  it('should get order by id', () => {
    api.getOrder('order-1').subscribe((order) => {
      expect(order.id).toBe('order-1');
      expect(order.eventId).toBe('event-1');
      expect(order.items.length).toBe(1);
    });

    const req = http.expectOne('http://localhost:8765/order-service/api/orders/v1/order-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'order-1',
      eventId: 'event-1',
      status: 'CONFIRMED',
      totalAmount: 100,
      itens: [{ orderItemId: 'item-1', sectorId: 'sector-1' }],
    });
  });

  it('should find orders by user id', () => {
    api.findOrdersByUserId('user-1').subscribe((orders) => {
      expect(orders.length).toBe(1);
      expect(orders[0]?.id).toBe('order-1');
      expect(orders[0]?.createdAt).toBe('2026-07-15T10:00:00Z');
    });

    const req = http.expectOne('http://localhost:8765/order-service/api/orders/v1/user/user-1/orders');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        orderId: 'order-1',
        eventId: 'event-1',
        status: 'AWAITING_PAYMENT',
        createdAt: '2026-07-15T10:00:00Z',
        totalAmount: 100,
      },
    ]);
  });
});
