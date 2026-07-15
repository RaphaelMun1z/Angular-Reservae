import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { CheckoutStore } from '../checkout/state/checkout.store';
import { OrderCreated } from './order-created';

describe('OrderCreated', () => {
  let component: OrderCreated;
  let fixture: ComponentFixture<OrderCreated>;
  let queryParamMap: Subject<ParamMap>;

  beforeEach(async () => {
    queryParamMap = new Subject<ParamMap>();

    await TestBed.configureTestingModule({
      imports: [OrderCreated],
      providers: [
        provideRouter([]),
        CheckoutStore,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCreated);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should label awaiting payment orders without payment link as reservation confirmed', () => {
    component.store.setOrder({
      id: 'order-1',
      eventId: 'event-1',
      status: 'AWAITING_PAYMENT',
      totalAmount: 10,
      paymentUrl: null,
      items: [],
    });

    expect(component.orderStatusLabel()).toBe('Reserva confirmada');
  });

  it('should label awaiting payment orders with payment link as payment available', () => {
    component.store.setOrder({
      id: 'order-1',
      eventId: 'event-1',
      status: 'AWAITING_PAYMENT',
      totalAmount: 10,
      paymentUrl: 'https://pay.test/order-1',
      items: [],
    });

    expect(component.orderStatusLabel()).toBe('Pagamento disponivel');
  });

  it('should retry when orderId exists', () => {
    const loadSpy = vi.spyOn(component.store, 'loadOrder');
    component.store.setOrder({
      id: 'order-1',
      eventId: 'event-1',
      status: 'AWAITING_PAYMENT',
      totalAmount: 10,
      paymentUrl: null,
      items: [],
    });

    component.retry();

    expect(loadSpy).toHaveBeenCalledWith('order-1');
  });

  it('should load the order from payment return query params', () => {
    const loadSpy = vi.spyOn(component.store, 'loadOrder');
    const pollingSpy = vi.spyOn(component.store, 'startOrderPolling');

    fixture.detectChanges();
    queryParamMap.next(convertToParamMap({ orderId: 'order-from-url', sessionId: 'cs_test_123' }));

    expect(loadSpy).toHaveBeenCalledWith('order-from-url');
    expect(pollingSpy).toHaveBeenCalledWith('order-from-url');
    expect(component.displayOrderId()).toBe('order-from-url');
    expect(component.paymentSessionId()).toBe('cs_test_123');
  });

  it('should retry using the order id received in the URL', () => {
    const loadSpy = vi.spyOn(component.store, 'loadOrder');

    fixture.detectChanges();
    queryParamMap.next(convertToParamMap({ orderId: 'order-from-url' }));

    loadSpy.mockClear();
    component.retry();

    expect(loadSpy).toHaveBeenCalledWith('order-from-url');
  });
});
