import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CHECKOUT_API, CheckoutApi, CheckoutOrder } from '../checkout/state/checkout.store';
import { AuthStore } from '../../core/state/auth.store';
import { MyOrders } from './my-orders';

class FakeCheckoutApi implements CheckoutApi {
  lastUserId: string | null = null;

  readonly orders: readonly CheckoutOrder[] = [
    {
      id: 'order-123456',
      eventId: null,
      status: 'AWAITING_PAYMENT',
      createdAt: '2026-07-15T10:00:00Z',
      totalAmount: 120,
      paymentUrl: 'https://pay.test/order-123456',
      items: [{ quantity: 2, ticketType: 'FULL_TICKET_PRICE' }],
    },
  ];

  startCheckout() {
    return of(this.orders[0]);
  }

  getOrder() {
    return of(this.orders[0]);
  }

  findOrdersByUserId(userId: string) {
    this.lastUserId = userId;
    return of(this.orders);
  }
}

describe('MyOrders', () => {
  let component: MyOrders;
  let fixture: ComponentFixture<MyOrders>;
  let api: FakeCheckoutApi;

  beforeEach(async () => {
    api = new FakeCheckoutApi();

    await TestBed.configureTestingModule({
      imports: [MyOrders],
      providers: [provideRouter([]), { provide: CHECKOUT_API, useValue: api }],
    }).compileComponents();

    TestBed.inject(AuthStore).updateSession({
      initialized: true,
      authenticated: true,
      userId: 'user-1',
      username: 'User',
      fullName: 'User',
      email: 'user@reservae.test',
      roles: [],
      profile: null,
    });

    fixture = TestBed.createComponent(MyOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list orders from the authenticated endpoint', () => {
    expect(component.store.orders().length).toBe(1);
    expect(component.shortOrderId(component.store.orders()[0])).toBe('ORDER-12');
    expect(api.lastUserId).toBe('user-1');
  });

  it('should identify awaiting payment orders', () => {
    expect(component.isPaymentPending('AWAITING_PAYMENT')).toBe(true);
  });
});
