import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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

  it('should redirect to a valid paymentUrl', () => {
    const authStore = TestBed.inject(AuthStore);
    const redirectSpy = vi.spyOn(component, 'redirectToPayment').mockImplementation(() => undefined);
    authStore.updateSession({ authenticated: true, userId: 'user-1', username: 'User', roles: [] });
    component.store.selectEvent('event-1');
    component.store.addItem({
      sectorId: 'sector-1',
      sectorName: 'Pista',
      quantity: 1,
      ticketType: 'FULL_TICKET_PRICE',
      unitPrice: 100,
    });

    component.payNow();

    expect(redirectSpy).toHaveBeenCalledOnce();
    expect(redirectSpy).toHaveBeenCalledWith('https://pay.test/order-1');
  });

  it('should show an error when paymentUrl is absent', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.updateSession({ authenticated: true, userId: 'user-1', username: 'User', roles: [] });
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

    expect(component.store.error()).toContain('URL de pagamento valida');
  });
});
