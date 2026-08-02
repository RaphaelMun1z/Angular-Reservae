import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
const CHECKOUT_CART_KEY = 'reservae.checkout.cart';
const ORDER_EVENT_REFERENCE_KEY = 'reservae.checkout.order-events';
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
  readonly userId?: string | null;
  readonly eventId: string | null;
  readonly eventTitle?: string | null;
  readonly eventDate?: string | null;
  readonly venueName?: string | null;
  readonly venueCity?: string | null;
  readonly venueState?: string | null;
  readonly status: OrderStatus | null;
  readonly createdAt?: string | null;
  readonly totalAmount: number | null;
  readonly paymentUrl: string | null;
  readonly items: readonly OrderItemResponseDTO[];
}

export interface CheckoutApi {
  startCheckout(request: CheckoutRequestDTO): Observable<CheckoutOrder>;
  getOrder(orderId: string): Observable<CheckoutOrder>;
  findOrdersByUserId(userId: string): Observable<readonly CheckoutOrder[]>;
}

interface CheckoutRecoveryReference {
  readonly orderId: string;
  readonly eventId: string | null;
}

interface CheckoutCartSnapshot {
  readonly eventId: string | null;
  readonly items: readonly CheckoutItem[];
}

type OrderEventReferences = Record<string, string>;

export const CHECKOUT_API = new InjectionToken<CheckoutApi>('CHECKOUT_API');

@Injectable({
  providedIn: 'root',
})
export class CheckoutStore {
  private readonly api = inject(CHECKOUT_API, { optional: true });
  private readonly authStore = inject(AuthStore);
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);

  private pollingSubscription: Subscription | null = null;
  private pollingOrderId: string | null = null;
  private orderRequestVersion = 0;

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
  readonly totalTickets = computed(() =>
    this._items().reduce((total, item) => total + item.quantity, 0),
  );
  readonly selectedSectorCount = computed(() => this._items().length);
  readonly hasItems = computed(() => this._items().length > 0);
  readonly visualSubtotal = computed(() =>
    this._items().reduce(
      (total, item) => total + this.moneyToNumber(item.unitPrice) * item.quantity,
      0,
    ),
  );
  readonly canContinue = computed(
    () => this._eventId() !== null && this.hasItems() && !this._loading(),
  );
  readonly processing = computed(() => this._loading() || this.isProcessingStatus(this.status()));
  readonly succeeded = computed(
    () =>
      this.status() === 'CONFIRMED' ||
      this.status() === 'PAYMENT_APPROVED' ||
      this.status() === 'APPROVED' ||
      this.status() === 'PAID',
  );
  readonly failed = computed(
    () =>
      this.status() === 'RESERVATION_FAILED' ||
      this.status() === 'RESERVATION_REJECTED' ||
      this.status() === 'PAYMENT_FAILED' ||
      this.status() === 'PAYMENT_NOT_CONFIRMED' ||
      this.status() === 'PAYMENT_DECLINED' ||
      this.status() === 'FAILED' ||
      this.status() === 'CANCELLED' ||
      this.status() === 'EXPIRED',
  );
  readonly paymentStatus = this.status;

  constructor() {
    this.restoreCart();
  }

  selectEvent(eventId: string | null): void {
    const previousEventId = this._eventId();

    if (previousEventId && eventId && previousEventId !== eventId) {
      this._items.set([]);
      this._order.set(null);
    }

    this._eventId.set(eventId);
    this.persistRecoveryReference();
    this.persistCart();
  }

  addItem(item: CheckoutItem): void {
    if (item.quantity <= 0) {
      this._error.set('Quantidade invalida.');
      return;
    }

    this._items.update((items) => {
      const existingItem = items.find((currentItem) =>
        this.isSameItem(currentItem, item.sectorId, item.ticketType),
      );

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
    this.persistCart();
  }

  changeQuantity(sectorId: string, quantity: number, ticketType?: TicketType): void {
    if (quantity <= 0) {
      this._error.set('Quantidade invalida.');
      return;
    }

    this._items.update((items) =>
      items.map((item) =>
        this.isSameItem(item, sectorId, ticketType ?? item.ticketType)
          ? { ...item, quantity }
          : item,
      ),
    );
    this._error.set(null);
    this.persistCart();
  }

  changeTicketType(
    sectorId: string,
    currentTicketType: TicketType,
    ticketType: TicketType,
    unitPrice: number,
  ): void {
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      this._error.set('Preco indisponivel para o tipo de ingresso selecionado.');
      return;
    }

    this._items.update((items) => {
      const currentItem = items.find(
        (item) => item.sectorId === sectorId && item.ticketType === currentTicketType,
      );

      if (!currentItem || currentTicketType === ticketType) {
        return items;
      }

      const targetItem = items.find(
        (item) => item.sectorId === sectorId && item.ticketType === ticketType,
      );

      if (targetItem) {
        return items
          .filter((item) => item !== currentItem)
          .map((item) =>
            item === targetItem
              ? { ...item, quantity: item.quantity + currentItem.quantity, unitPrice }
              : item,
          );
      }

      return items.map((item) =>
        item === currentItem ? { ...item, ticketType, unitPrice } : item,
      );
    });
    this._error.set(null);
    this.persistCart();
  }

  removeItem(sectorId: string, ticketType?: TicketType): void {
    this._items.update((items) =>
      items.filter((item) => !this.isSameItem(item, sectorId, ticketType ?? item.ticketType)),
    );
    this.persistCart();
  }

  clearSelection(): void {
    this._items.set([]);
    this._error.set(null);
    this.storage.remove(CHECKOUT_CART_KEY);
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
        tap((order) => {
          this.setOrder(order);

          if (order.id) {
            this.clearSubmittedCart();
          }
        }),
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

    this.stopOrderPolling();
    const requestVersion = ++this.orderRequestVersion;
    this._loading.set(true);
    this._error.set(null);

    this.api
      .getOrder(orderId)
      .pipe(
        tap((order) => {
          if (requestVersion === this.orderRequestVersion) {
            this.setOrder(order);
          }
        }),
        catchError((error: unknown) => {
          if (requestVersion === this.orderRequestVersion) {
            this._error.set(this.errorMessage(error, 'Nao foi possivel consultar o pedido.'));
          }
          return of(null);
        }),
        finalize(() => {
          if (requestVersion === this.orderRequestVersion) {
            this._loading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  restorePendingOrder(): string | null {
    const reference = this.storage.get<CheckoutRecoveryReference>(
      CHECKOUT_RECOVERY_KEY,
      sessionStorage,
    );

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

    if (
      this.pollingOrderId === orderId &&
      this.pollingSubscription &&
      !this.pollingSubscription.closed
    ) {
      return;
    }

    this.stopOrderPolling();
    this.pollingOrderId = orderId;
    const requestVersion = ++this.orderRequestVersion;

    this.pollingSubscription = timer(0, ORDER_POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => api.getOrder(orderId)),
        tap((order) => {
          if (requestVersion !== this.orderRequestVersion) {
            return;
          }

          this.setOrder(order);

          if (this.isFinalOrder(order)) {
            this.stopOrderPolling();
          }
        }),
        catchError((error: unknown) => {
          if (requestVersion === this.orderRequestVersion) {
            this._error.set(this.errorMessage(error, 'Nao foi possivel acompanhar o pedido.'));
            this.stopOrderPolling();
          }
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
    this.storage.remove(CHECKOUT_CART_KEY);
    this._items.set([]);
    this._order.set(null);
    this._eventId.set(null);
    this._error.set(null);
  }

  setOrder(order: CheckoutOrder): void {
    const eventId = order.eventId ?? this.eventIdForOrder(order.id) ?? this._eventId();
    const normalizedOrder = { ...order, eventId };

    this._order.set(normalizedOrder);
    this._eventId.set(eventId);

    if (normalizedOrder.id && eventId) {
      this.persistOrderEventReference(normalizedOrder.id, eventId);
    }

    if (this.isFinalOrder(normalizedOrder)) {
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

  private restoreCart(): void {
    const snapshot = this.storage.get<CheckoutCartSnapshot>(CHECKOUT_CART_KEY);

    if (!snapshot || !this.isCheckoutCartSnapshot(snapshot)) {
      this.storage.remove(CHECKOUT_CART_KEY);
      return;
    }

    this._eventId.set(snapshot.eventId);
    this._items.set(snapshot.items.map((item) => ({ ...item })));
  }

  private persistCart(): void {
    const items = this._items();

    if (items.length === 0) {
      this.storage.remove(CHECKOUT_CART_KEY);
      return;
    }

    this.storage.set<CheckoutCartSnapshot>(CHECKOUT_CART_KEY, {
      eventId: this._eventId(),
      items: items.map((item) => ({ ...item })),
    });
  }

  private clearSubmittedCart(): void {
    this._items.set([]);
    this.storage.remove(CHECKOUT_CART_KEY);
  }

  private eventIdForOrder(orderId: string): string | null {
    if (!orderId) {
      return null;
    }

    const references = this.storage.get<OrderEventReferences>(ORDER_EVENT_REFERENCE_KEY);
    const eventId = references?.[orderId];
    return typeof eventId === 'string' && eventId.trim() ? eventId : null;
  }

  private persistOrderEventReference(orderId: string, eventId: string): void {
    const references = this.storage.get<OrderEventReferences>(ORDER_EVENT_REFERENCE_KEY) ?? {};
    this.storage.set<OrderEventReferences>(ORDER_EVENT_REFERENCE_KEY, {
      ...references,
      [orderId]: eventId,
    });
  }

  private isCheckoutRecoveryReference(
    value: CheckoutRecoveryReference,
  ): value is CheckoutRecoveryReference {
    return typeof value.orderId === 'string' && value.orderId.length > 0;
  }

  private isCheckoutCartSnapshot(value: CheckoutCartSnapshot): value is CheckoutCartSnapshot {
    return (
      (value.eventId === null || typeof value.eventId === 'string') &&
      Array.isArray(value.items) &&
      value.items.every((item) => this.isCheckoutItem(item))
    );
  }

  private isCheckoutItem(item: CheckoutItem): item is CheckoutItem {
    return (
      typeof item.sectorId === 'string' &&
      typeof item.sectorName === 'string' &&
      typeof item.quantity === 'number' &&
      item.quantity > 0 &&
      (item.ticketType === 'FULL_TICKET_PRICE' || item.ticketType === 'HALF_TICKET_PRICE') &&
      typeof item.unitPrice === 'number'
    );
  }

  private isFinalOrder(order: CheckoutOrder): boolean {
    return (
      order.status === 'CONFIRMED' ||
      order.status === 'PAYMENT_APPROVED' ||
      order.status === 'APPROVED' ||
      order.status === 'PAID' ||
      order.status === 'RESERVATION_FAILED' ||
      order.status === 'RESERVATION_REJECTED' ||
      order.status === 'PAYMENT_FAILED' ||
      order.status === 'PAYMENT_NOT_CONFIRMED' ||
      order.status === 'PAYMENT_DECLINED' ||
      order.status === 'FAILED' ||
      order.status === 'CANCELLED' ||
      order.status === 'EXPIRED'
    );
  }

  private isProcessingStatus(status: OrderStatus | null): boolean {
    return (
      status === 'PENDING' ||
      status === 'PROCESSING' ||
      status === 'RESERVATION_CONFIRMED' ||
      status === 'RESERVED' ||
      status === 'AWAITING_PAYMENT' ||
      status === 'PAYMENT_PENDING'
    );
  }

  private moneyToNumber(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  private isSameItem(item: CheckoutItem, sectorId: string, ticketType: TicketType): boolean {
    return item.sectorId === sectorId && item.ticketType === ticketType;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Voce nao tem permissao para acessar este pedido.';
      }

      if (error.status === 404) {
        return 'Pedido nao encontrado.';
      }

      const message =
        typeof error.error?.message === 'string' ? error.error.message : error.message;
      return message ? `${fallback} ${message}` : fallback;
    }

    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
