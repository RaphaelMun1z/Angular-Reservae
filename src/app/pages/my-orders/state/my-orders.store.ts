import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { CheckoutOrder, CHECKOUT_API } from '../../checkout/state/checkout.store';
import { OrderStatus } from '../../../core/models/order.model';
import { AuthStore } from '../../../core/state/auth.store';

export type OrderStatusFilter = OrderStatus | 'ALL';

@Injectable()
export class MyOrdersStore {
  private readonly api = inject(CHECKOUT_API, { optional: true });
  private readonly authStore = inject(AuthStore);

  private readonly _orders = signal<CheckoutOrder[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _statusFilter = signal<OrderStatusFilter>('ALL');

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly hasOrders = computed(() => this._orders().length > 0);
  readonly filteredOrders = computed(() => {
    const filter = this._statusFilter();
    return filter === 'ALL' ? this._orders() : this._orders().filter((order) => order.status === filter);
  });

  loadOrders(): void {
    if (!this.api) {
      this._error.set('Integracao de pedidos nao configurada.');
      return;
    }

    const userId = this.authStore.userId();

    if (!userId) {
      this._orders.set([]);
      this._loading.set(false);
      this._error.set('Nao foi possivel identificar o usuario atual.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .findOrdersByUserId(userId)
      .pipe(
        tap((orders) => this._orders.set(orders.map((order) => ({ ...order })))),
        catchError((error: unknown) => {
          this._orders.set([]);
          this._error.set(this.errorMessage(error));
          return of([]);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  setStatusFilter(status: OrderStatusFilter): void {
    this._statusFilter.set(status);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Voce nao tem permissao para acessar seus pedidos.';
      }

      const message = typeof error.error?.message === 'string' ? error.error.message : error.message;
      return message ? `Nao foi possivel carregar seus pedidos. ${message}` : 'Nao foi possivel carregar seus pedidos.';
    }

    if (error instanceof Error && error.message) {
      return `Nao foi possivel carregar seus pedidos. ${error.message}`;
    }

    return 'Nao foi possivel carregar seus pedidos.';
  }
}
