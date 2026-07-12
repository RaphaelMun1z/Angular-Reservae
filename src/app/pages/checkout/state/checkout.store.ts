import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of, Subscription, timer } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { StorageService } from '../../../core/services/storage.service';
import { TicketType } from '../../../core/models/event-catalog.model';
import {
  CheckoutRequestDTO,
  OrderItemResponseDTO,
  OrderStatus,
} from '../../../core/models/order.model';
import { AuthStore } from '../../../core/state/auth.store';

const CHECKOUT_RECOVERY_KEY = 'reservae.checkout.recovery';
const ORDER_POLLING_INTERVAL_MS = 3000;

export interface CheckoutItem {
  readonly sectorId: string;
  readonly sectorName: string;
  readonly quantity: number;
  readonly ticketType: TicketType;
  readonly unitPrice: number;
}

export interface CheckoutOrder {
  readonly id: string;
  readonly eventId: string | null;
  readonly status: OrderStatus | null;
  readonly totalAmount: number | null;
  readonly paymentUrl: string | null;
  readonly items: readonly OrderItemResponseDTO[];
}

export interface CheckoutApi {
  startCheckout(request: CheckoutRequestDTO): Observable<CheckoutOrder>;
  getOrder(orderId: string): Observable<CheckoutOrder>;
}

interface CheckoutRecoveryReference {
  readonly orderId: string;
  readonly eventId: string | null;
}

export const CHECKOUT_API = new InjectionToken<CheckoutApi>('CHECKOUT_API');

@Injectable()
export class CheckoutStore {
  private readonly api = inject(CHECKOUT_API, { optional: true });
  private readonly authStore = inject(AuthStore);
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);

  private pollingSubscription: Subscription | null = null;
  private pollingOrderId: string | null = null;

  private readonly _eventId = signal<string | null>(null);
  private readonly _items = signal<CheckoutItem[]>([]);
  private readonly _order = signal<CheckoutOrder | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly eventId = this._eventId.asReadonly();
  readonly items = this._items.asReadonly();
  readonly order = this._order.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly orderId = computed(() => this._order()?.id ?? null);
  readonly status = computed(() => this._order()?.status ?? null);
  readonly paymentUrl = computed(() => this._order()?.paymentUrl ?? null);
  readonly totalAmount = computed(() => this._order()?.totalAmount ?? null);
  readonly totalTickets = computed(() => this._items().reduce((total, item) => total + item.quantity, 0));
  readonly selectedSectorCount = computed(() => this._items().length);
  readonly hasItems = computed(() => this._items().length > 0);
  readonly visualSubtotal = computed(() =>
    this._items().reduce((total, item) => total + this.moneyToNumber(item.unitPrice) * item.quantity, 0),
  );
  readonly canContinue = computed(() => this._eventId() !== null && this.hasItems() && !this._loading());
  readonly processing = computed(() => this._loading() || this.isProcessingStatus(this.status()));
  readonly succeeded = computed(() => this.status() === 'CONFIRMED');
  readonly failed = computed(
    () =>
      this.status() === 'RESERVATION_FAILED' ||
      this.status() === 'PAYMENT_FAILED' ||
      this.status() === 'CANCELLED',
  );
  readonly paymentStatus = this.status;

  selectEvent(eventId: string | null): void {
    this._eventId.set(eventId);
    this.persistRecoveryReference();
  }

  addItem(item: CheckoutItem): void {
    if (item.quantity <= 0) {
      this._error.set('Quantidade invalida.');
      return;
    }

    this._items.update((items) => {
      const existingItem = items.find((currentItem) => this.isSameItem(currentItem, item.sectorId, item.ticketType));

      if (!existingItem) {
        return [...items, { ...item }];
      }

      return items.map((currentItem) =>
        this.isSameItem(currentItem, item.sectorId, item.ticketType)
          ? { ...currentItem, quantity: currentItem.quantity + item.quantity }
          : currentItem,
      );
    });
    this._error.set(null);
  }

  changeQuantity(sectorId: string, quantity: number, ticketType?: TicketType): void {
    if (quantity <= 0) {
      this._error.set('Quantidade invalida.');
      return;
    }

    this._items.update((items) =>
      items.map((item) =>
        this.isSameItem(item, sectorId, ticketType ?? item.ticketType) ? { ...item, quantity } : item,
      ),
    );
    this._error.set(null);
  }

  removeItem(sectorId: string, ticketType?: TicketType): void {
    this._items.update((items) =>
      items.filter((item) => !this.isSameItem(item, sectorId, ticketType ?? item.ticketType)),
    );
  }

  clearSelection(): void {
    this._items.set([]);
    this._error.set(null);
  }

  setError(message: string): void {
    this._error.set(message);
  }

  setPaymentRedirectError(): void {
    this.setError('Pedido criado, mas o backend nao retornou uma URL de pagamento valida.');
  }

  startCheckout(): void {
    this.createCheckout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  createCheckout(): Observable<CheckoutOrder | null> {
    if (!this.api) {
      this._error.set('Integracao de checkout nao configurada.');
      return of(null);
    }

    const eventId = this._eventId();
    const items = this._items();
    const userId = this.authStore.userId();

    if (!eventId || items.length === 0) {
      this._error.set('Selecione pelo menos um ingresso antes de continuar.');
      return of(null);
    }

    if (!userId) {
      this._error.set('Usuario autenticado nao identificado para criar o pedido.');
      return of(null);
    }

    if (this._loading()) {
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.api
      .startCheckout({
        userId,
        eventId,
        items: items.map((item) => ({
          sectorId: item.sectorId,
          ticketType: item.ticketType,
          quantity: item.quantity,
        })),
      })
      .pipe(
        tap((order) => this.setOrder(order)),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel iniciar o checkout.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      );
  }

  loadOrder(orderId: string): void {
    if (!this.api) {
      this._error.set('Integracao de checkout nao configurada.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .getOrder(orderId)
      .pipe(
        tap((order) => this.setOrder(order)),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel consultar o pedido.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  restorePendingOrder(): string | null {
    const reference = this.storage.get<CheckoutRecoveryReference>(CHECKOUT_RECOVERY_KEY, sessionStorage);

    if (!reference) {
      return null;
    }

    if (!this.isCheckoutRecoveryReference(reference)) {
      this.storage.remove(CHECKOUT_RECOVERY_KEY, sessionStorage);
      this._error.set('Referencia de checkout invalida. Inicie a compra novamente.');
      return null;
    }

    this._eventId.set(reference.eventId);
    this.loadOrder(reference.orderId);
    return reference.orderId;
  }

  startOrderPolling(orderId: string): void {
    if (!orderId) {
      this._error.set('Pedido nao identificado para acompanhamento.');
      return;
    }

    if (!this.api) {
      this._error.set('Integracao de checkout nao configurada.');
      return;
    }

    const api = this.api;

    if (this.pollingOrderId === orderId && this.pollingSubscription && !this.pollingSubscription.closed) {
      return;
    }

    this.stopOrderPolling();
    this.pollingOrderId = orderId;

    this.pollingSubscription = timer(0, ORDER_POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => api.getOrder(orderId)),
        tap((order) => {
          this.setOrder(order);

          if (this.isFinalOrder(order)) {
            this.stopOrderPolling();
          }
        }),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel acompanhar o pedido.'));
          this.stopOrderPolling();
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  stopOrderPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    this.pollingOrderId = null;
  }

  finishCheckout(): void {
    this.stopOrderPolling();
    this.storage.remove(CHECKOUT_RECOVERY_KEY, sessionStorage);
    this._items.set([]);
    this._order.set(null);
    this._eventId.set(null);
    this._error.set(null);
  }

  setOrder(order: CheckoutOrder): void {
    this._order.set({ ...order });
    this._eventId.set(order.eventId ?? this._eventId());

    if (this.isFinalOrder(order)) {
      this.storage.remove(CHECKOUT_RECOVERY_KEY, sessionStorage);
      return;
    }

    this.persistRecoveryReference();
  }

  private persistRecoveryReference(): void {
    const orderId = this._order()?.id;

    if (!orderId) {
      return;
    }

    this.storage.set<CheckoutRecoveryReference>(
      CHECKOUT_RECOVERY_KEY,
      { orderId, eventId: this._eventId() },
      sessionStorage,
    );
  }

  private isCheckoutRecoveryReference(value: CheckoutRecoveryReference): value is CheckoutRecoveryReference {
    return typeof value.orderId === 'string' && value.orderId.length > 0;
  }

  private isFinalOrder(order: CheckoutOrder): boolean {
    return (
      order.status === 'CONFIRMED' ||
      order.status === 'RESERVATION_FAILED' ||
      order.status === 'PAYMENT_FAILED' ||
      order.status === 'CANCELLED'
    );
  }

  private isProcessingStatus(status: OrderStatus | null): boolean {
    return status === 'PENDING' || status === 'AWAITING_PAYMENT';
  }

  private moneyToNumber(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  private isSameItem(item: CheckoutItem, sectorId: string, ticketType: TicketType): boolean {
    return item.sectorId === sectorId && item.ticketType === ticketType;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
