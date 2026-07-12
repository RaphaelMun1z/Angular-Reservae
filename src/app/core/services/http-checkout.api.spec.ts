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
    expect(req.request.body).toEqual(request);
    req.flush({ orderId: 'order-1', status: 'AWAITING_PAYMENT', totalAmount: 100 });
  });

  it('should get order by id', () => {
    api.getOrder('order-1').subscribe((order) => {
      expect(order.id).toBe('order-1');
      expect(order.items.length).toBe(1);
    });

    const req = http.expectOne('http://localhost:8765/order-service/api/orders/v1/order-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      orderId: 'order-1',
      status: 'CONFIRMED',
      totalAmount: 100,
      itens: [{ orderItemId: 'item-1', sectorId: 'sector-1' }],
    });
  });
});
