import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Ticket } from '../../../core/models/ticket.model';
import { AuthStore } from '../../../core/state/auth.store';

export interface TicketTransferRequest {
  readonly ticketId: string;
  readonly recipientEmail: string;
}

export interface TicketApi {
  listTickets(userId: string): Observable<readonly Ticket[]>;
  getTicket(ticketId: string): Observable<Ticket>;
  revokeTicket(ticketId: string): Observable<Ticket>;
  transferTicket(request: TicketTransferRequest): Observable<Ticket>;
}

export const TICKET_API = new InjectionToken<TicketApi>('TICKET_API');

@Injectable()
export class TicketStore {
  private readonly api = inject(TICKET_API, { optional: true });
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _tickets = signal<Ticket[]>([]);
  private readonly _selectedTicket = signal<Ticket | null>(null);
  private readonly _statusFilter = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly tickets = this._tickets.asReadonly();
  readonly selectedTicket = this._selectedTicket.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasTickets = computed(() => this._tickets().length > 0);
  readonly filteredTickets = computed(() => {
    const statusFilter = this._statusFilter();
    return statusFilter
      ? this._tickets().filter((ticket) => ticket.status === statusFilter)
      : this._tickets();
  });

  loadTickets(): void {
    if (!this.api) {
      this._error.set('Integracao de ingressos nao configurada.');
      return;
    }

    const userId = this.authStore.userId();

    if (!userId) {
      this._error.set('Usuario autenticado nao identificado para consultar ingressos.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .listTickets(userId)
      .pipe(
        tap((tickets) => this._tickets.set(tickets.map((ticket) => ({ ...ticket })))),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel carregar ingressos.'));
          return of([]);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadTicket(ticketId: string): void {
    if (!this.api) {
      this._error.set('Integracao de ingressos nao configurada.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .getTicket(ticketId)
      .pipe(
        tap((ticket) => this._selectedTicket.set({ ...ticket })),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel carregar o ingresso.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  setStatusFilter(status: string | null): void {
    this._statusFilter.set(status);
    this.loadTickets();
  }

  transferTicket(request: TicketTransferRequest): void {
    if (!request.ticketId || !request.recipientEmail) {
      this._error.set('Informe o ingresso e o destinatario para transferir.');
      return;
    }

    this._error.set('Transferencia de ingresso indisponivel: endpoint nao documentado no ticket-service.');
  }

  revokeTicket(ticketId: string): void {
    if (!this.api) {
      this._error.set('Integracao de ingressos nao configurada.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .revokeTicket(ticketId)
      .pipe(
        tap((updatedTicket) => {
          this._selectedTicket.set({ ...updatedTicket });
          this._tickets.update((tickets) =>
            tickets.map((ticket) => (ticket.id === updatedTicket.id ? { ...updatedTicket } : ticket)),
          );
        }),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel revogar o ingresso.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearSelectedTicket(): void {
    this._selectedTicket.set(null);
  }

  setError(message: string): void {
    this._error.set(message);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
