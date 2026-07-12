import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthStore } from '../../../core/state/auth.store';
import { CheckoutRequestDTO } from '../../../core/models/order.model';
import { CHECKOUT_API, CheckoutApi, CheckoutOrder, CheckoutStore } from './checkout.store';

class FakeCheckoutApi implements CheckoutApi {
  startCheckoutResponse: Observable<CheckoutOrder> = of({
    id: 'order-1',
    eventId: 'event-1',
    status: 'AWAITING_PAYMENT',
    totalAmount: 10,
    paymentUrl: 'https://pay.test/order-1',
    items: [],
  });

  orderResponses: CheckoutOrder[] = [
    {
      id: 'order-1',
      eventId: 'event-1',
      status: 'AWAITING_PAYMENT',
      totalAmount: 10,
      paymentUrl: 'https://pay.test/order-1',
      items: [],
    },
  ];

  getOrderCalls = 0;
  startCheckoutCalls = 0;
  lastRequest: CheckoutRequestDTO | null = null;

  startCheckout(request: CheckoutRequestDTO): Observable<CheckoutOrder> {
    this.startCheckoutCalls += 1;
    this.lastRequest = request;
    return this.startCheckoutResponse;
  }

  getOrder(): Observable<CheckoutOrder> {
    const response = this.orderResponses[Math.min(this.getOrderCalls, this.orderResponses.length - 1)];
    this.getOrderCalls += 1;
    return of(response);
  }
}

describe('CheckoutStore', () => {
  let store: CheckoutStore;
  let api: FakeCheckoutApi;

  beforeEach(() => {
    sessionStorage.clear();
    api = new FakeCheckoutApi();

    TestBed.configureTestingModule({
      providers: [CheckoutStore, { provide: CHECKOUT_API, useValue: api }],
    });

    store = TestBed.inject(CheckoutStore);
    TestBed.inject(AuthStore).updateSession({
      authenticated: true,
      userId: 'user-1',
      username: 'User',
      roles: [],
    });
  });

  it('should add items and calculate visual totals', () => {
    store.selectEvent('event-1');
    store.addItem({
      sectorId: 'front',
      sectorName: 'Front',
      quantity: 2,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 10.5,
    });

    expect(store.totalTickets()).toBe(2);
    expect(store.visualSubtotal()).toBe(21);
    expect(store.hasItems()).toBe(true);
    expect(store.canContinue()).toBe(true);
  });

  it('should change and remove item quantities', () => {
    store.addItem({
      sectorId: 'front',
      sectorName: 'Front',
      quantity: 2,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 10,
    });

    store.changeQuantity('front', 3);
    expect(store.totalTickets()).toBe(3);

    store.removeItem('front');
    expect(store.hasItems()).toBe(false);
  });

  it('should reject invalid quantities', () => {
    store.addItem({
      sectorId: 'front',
      sectorName: 'Front',
      quantity: 0,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 10,
    });

    expect(store.items()).toEqual([]);
    expect(store.error()).toContain('Quantidade invalida');
  });

  it('should start checkout and store the returned order', () => {
    store.selectEvent('event-1');
    store.addItem({
      sectorId: 'front',
      sectorName: 'Front',
      quantity: 1,
      ticketType: 'HALF_TICKET_PRICE',
      unitPrice: 10,
    });

    store.startCheckout();

    expect(store.orderId()).toBe('order-1');
    expect(store.status()).toBe('AWAITING_PAYMENT');
    expect(api.lastRequest).toEqual({
      userId: 'user-1',
      eventId: 'event-1',
      items: [{ sectorId: 'front', ticketType: 'HALF_TICKET_PRICE', quantity: 1 }],
    });
  });

  it('should not start checkout without userId', () => {
    TestBed.inject(AuthStore).clearSession();
    store.selectEvent('event-1');
    store.addItem({
      sectorId: 'front',
      sectorName: 'Front',
      quantity: 1,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 10,
    });

    store.startCheckout();

    expect(api.startCheckoutCalls).toBe(0);
    expect(store.error()).toContain('Usuario autenticado');
  });

  it('should keep null paymentUrl when backend does not return it', () => {
    store.setOrder({
      id: 'order-1',
      eventId: 'event-1',
      status: 'AWAITING_PAYMENT',
      totalAmount: 10,
      paymentUrl: null,
      items: [],
    });

    expect(store.paymentUrl()).toBeNull();
  });

  it('should expose errors when checkout fails', () => {
    api.startCheckoutResponse = throwError(() => new Error('offline'));
    store.selectEvent('event-1');
    store.addItem({
      sectorId: 'front',
      sectorName: 'Front',
      quantity: 1,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 10,
    });

    store.startCheckout();

    expect(store.error()).toContain('offline');
  });

  it('should restore a pending order reference', () => {
    sessionStorage.setItem(
      'reservae.checkout.recovery',
      JSON.stringify({ orderId: 'order-1', eventId: 'event-1' }),
    );

    store.restorePendingOrder();

    expect(store.eventId()).toBe('event-1');
    expect(store.orderId()).toBe('order-1');
  });

  it('should remove invalid checkout recovery reference', () => {
    sessionStorage.setItem('reservae.checkout.recovery', JSON.stringify({ eventId: 'event-1' }));

    store.restorePendingOrder();

    expect(api.getOrderCalls).toBe(0);
    expect(sessionStorage.getItem('reservae.checkout.recovery')).toBeNull();
    expect(store.error()).toContain('Referencia de checkout invalida');
  });

  it('should not start polling without a valid orderId', () => {
    store.startOrderPolling('');

    expect(api.getOrderCalls).toBe(0);
    expect(store.error()).toContain('Pedido nao identificado');
  });

  it('should stop polling when order reaches a final status', async () => {
    vi.useFakeTimers();
    api.orderResponses = [
      {
        id: 'order-1',
        eventId: 'event-1',
        status: 'AWAITING_PAYMENT',
        totalAmount: 10,
        paymentUrl: null,
        items: [],
      },
      {
        id: 'order-1',
        eventId: 'event-1',
        status: 'CONFIRMED',
        totalAmount: 10,
        paymentUrl: null,
        items: [],
      },
    ];

    store.startOrderPolling('order-1');
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(6000);

    expect(store.succeeded()).toBe(true);
    expect(api.getOrderCalls).toBe(2);
    vi.useRealTimers();
  });
});
