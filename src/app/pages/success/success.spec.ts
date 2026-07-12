import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Success } from './success';

import { CheckoutStore } from '../checkout/state/checkout.store';
describe('Success', () => {
  let component: Success;
  let fixture: ComponentFixture<Success>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Success],
      providers: [provideRouter([]), CheckoutStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Success);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show pending message', () => {
    component.store.setOrder({ id: 'order-1', eventId: 'event-1', status: 'PENDING', totalAmount: 10, paymentUrl: null, items: [] });

    expect(component.statusMessage()).toContain('reserva ainda esta em processamento');
  });

  it('should show confirmed message', () => {
    component.store.setOrder({ id: 'order-1', eventId: 'event-1', status: 'CONFIRMED', totalAmount: 10, paymentUrl: null, items: [] });

    expect(component.statusMessage()).toContain('confirmada');
  });

  it('should retry when orderId exists', () => {
    const loadSpy = vi.spyOn(component.store, 'loadOrder');
    component.store.setOrder({ id: 'order-1', eventId: 'event-1', status: 'AWAITING_PAYMENT', totalAmount: 10, paymentUrl: null, items: [] });

    component.retry();

    expect(loadSpy).toHaveBeenCalledWith('order-1');
  });
});
