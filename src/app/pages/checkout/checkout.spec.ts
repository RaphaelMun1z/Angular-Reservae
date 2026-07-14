import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Checkout } from './checkout';

import { Observable, of } from 'rxjs';
import { AuthStore } from '../../core/state/auth.store';
import { CheckoutApi, CheckoutOrder, CheckoutStore, CHECKOUT_API } from './state/checkout.store';

class FakeCheckoutApi implements CheckoutApi {
  response: CheckoutOrder = {
    id: 'order-1',
    eventId: 'event-1',
    status: 'AWAITING_PAYMENT',
    totalAmount: 100,
    paymentUrl: 'https://pay.test/order-1',
    items: [],
  };
  calls = 0;

  startCheckout(): Observable<CheckoutOrder> {
    this.calls += 1;
    return of(this.response);
  }

  getOrder(): Observable<CheckoutOrder> {
    return of(this.response);
  }
}

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;
  let api: FakeCheckoutApi;

  beforeEach(async () => {
    api = new FakeCheckoutApi();
    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideRouter([]), CheckoutStore, { provide: CHECKOUT_API, useValue: api }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit an empty checkout', () => {
    component.payNow();

    expect(api.calls).toBe(0);
    expect(component.store.error()).toContain('Selecione');
  });

  it('should create an async checkout and navigate to the order created page', () => {
    const authStore = TestBed.inject(AuthStore);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authStore.updateSession({
      initialized: true,
      authenticated: true,
      userId: 'user-1',
      username: 'User',
      fullName: 'User',
      email: 'user@reservae.test',
      roles: [],
      profile: null,
    });
    component.store.selectEvent('event-1');
    component.store.addItem({
      sectorId: 'sector-1',
      sectorName: 'Pista',
      quantity: 1,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 100,
    });

    component.payNow();

    expect(api.calls).toBe(1);
    expect(navigateSpy).toHaveBeenCalledWith('/order-created');
  });

  it('should accept checkout creation without an immediate paymentUrl', () => {
    const authStore = TestBed.inject(AuthStore);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authStore.updateSession({
      initialized: true,
      authenticated: true,
      userId: 'user-1',
      username: 'User',
      fullName: 'User',
      email: 'user@reservae.test',
      roles: [],
      profile: null,
    });
    api.response = { ...api.response, paymentUrl: null };
    component.store.selectEvent('event-1');
    component.store.addItem({
      sectorId: 'sector-1',
      sectorName: 'Pista',
      quantity: 1,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 100,
    });

    component.payNow();

    expect(component.store.error()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/order-created');
  });
});
