import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CheckoutStore } from '../checkout/state/checkout.store';
import { OrderCreated } from './order-created';

describe('OrderCreated', () => {
  let component: OrderCreated;
  let fixture: ComponentFixture<OrderCreated>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCreated],
      providers: [provideRouter([]), CheckoutStore],
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
});
