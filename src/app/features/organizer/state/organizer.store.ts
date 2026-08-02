import { computed, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { EventFilters } from '../../../core/http/contracts/events.contracts';
import { ValidateAccessRequestDTO } from '../../../core/models/ticket.model';
import { OrganizerAccessApi } from '../data-access/organizer-access.api';
import { OrganizerEventApi } from '../data-access/organizer-event.api';
import { OrganizerOrderApi } from '../data-access/organizer-order.api';
import { OrganizerTicketApi } from '../data-access/organizer-ticket.api';
import { OrganizerAccessLogViewModel, OrganizerCheckinValidationViewModel, OrganizerEventDetailsViewModel, OrganizerEventSummaryViewModel, OrganizerOrderViewModel, OrganizerSectorManagementItemViewModel, OrganizerTicketViewModel } from '../organizer.models';

const EMPTY_FILTERS: EventFilters = { search: '', city: null, state: null, status: null, startDate: null, endDate: null, page: 0, size: 20, sort: 'eventDate,asc' };

@Injectable({ providedIn: 'root' })
export class OrganizerStore {
  private readonly eventApi = inject(OrganizerEventApi);
  private readonly orderApi = inject(OrganizerOrderApi);
  private readonly ticketApi = inject(OrganizerTicketApi);
  private readonly accessApi = inject(OrganizerAccessApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _events = signal<readonly OrganizerEventSummaryViewModel[]>([]);
  private readonly _event = signal<OrganizerEventDetailsViewModel | null>(null);
  private readonly _sectors = signal<readonly OrganizerSectorManagementItemViewModel[]>([]);
  private readonly _orders = signal<readonly OrganizerOrderViewModel[]>([]);
  private readonly _tickets = signal<readonly OrganizerTicketViewModel[]>([]);
  private readonly _logs = signal<readonly OrganizerAccessLogViewModel[]>([]);
  private readonly _validations = signal<readonly OrganizerCheckinValidationViewModel[]>([]);
  private readonly _search = signal('');
  private readonly _status = signal('ALL');
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _eventsLoaded = signal(false);
  private readonly _ordersLoaded = signal(false);
  private readonly _ticketsLoaded = signal(false);
  private readonly _logsLoaded = signal(false);

  readonly events = computed(() => this._events().filter((event) => {
    const search = this._search().trim().toLocaleLowerCase();
    return (!search || event.name.toLocaleLowerCase().includes(search)) && (this._status() === 'ALL' || event.status === this._status());
  }));
  readonly event = this._event.asReadonly(); readonly sectors = this._sectors.asReadonly(); readonly orders = this._orders.asReadonly(); readonly tickets = this._tickets.asReadonly(); readonly logs = this._logs.asReadonly(); readonly validations = this._validations.asReadonly();
  readonly search = this._search.asReadonly(); readonly status = this._status.asReadonly(); readonly loading = this._loading.asReadonly(); readonly error = this._error.asReadonly();
  readonly hasEvents = computed(() => this.events().length > 0); readonly hasOrders = computed(() => this._orders().length > 0); readonly hasTickets = computed(() => this._tickets().length > 0); readonly hasLogs = computed(() => this._logs().length > 0);
  readonly eventsLoaded = this._eventsLoaded.asReadonly(); readonly ordersLoaded = this._ordersLoaded.asReadonly(); readonly ticketsLoaded = this._ticketsLoaded.asReadonly(); readonly logsLoaded = this._logsLoaded.asReadonly();
  readonly confirmedOrders = computed(() => this._orders().filter((order) => ['CONFIRMED', 'PAID', 'PAYMENT_APPROVED', 'APPROVED'].includes(order.status ?? '')).length);
  readonly pendingOrders = computed(() => this._orders().filter((order) => ['PENDING', 'PROCESSING', 'AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(order.status ?? '')).length);
  readonly soldTickets = computed(() => this._tickets().length);
  readonly allowedCheckins = computed(() => this._logs().filter((log) => log.result === 'GRANTED' || log.result === 'ALLOWED').length);

  loadEvents(): void { this._loading.set(true); this._error.set(null); this.eventApi.list(EMPTY_FILTERS).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._error.set('Não foi possível carregar os eventos no momento.'); return of({ items: [] }); }), finalize(() => { this._loading.set(false); this._eventsLoaded.set(true); })).subscribe((response) => this._events.set(response.items.map((event) => ({ ...event, status: event.status ?? null })))); }
  loadEvent(eventId: string): void { this._loading.set(true); this._error.set(null); this.eventApi.get(eventId).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._event.set(null); this._error.set('Evento não encontrado ou indisponível.'); return of(null); }), finalize(() => this._loading.set(false))).subscribe((event) => { if (event) { this._event.set({ ...event, status: event.status ?? null, sectors: [] }); } }); }
  loadSectors(eventId: string): void { this.eventApi.sectors(eventId).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._sectors.set([]); return of([]); })).subscribe((sectors) => { this._sectors.set(sectors.map((sector) => ({ id: sector.id, name: sector.name, capacity: sector.totalCapacity ?? null, fullPrice: sector.basePrice ?? null, halfPrice: sector.halfPrice ?? null, available: sector.availableQuantity ?? null }))); }); }
  loadOrders(eventId: string): void { this._loading.set(true); this._error.set(null); this.orderApi.listByEvent(eventId).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._error.set('Não foi possível carregar as vendas deste evento no momento.'); return of([]); }), finalize(() => { this._loading.set(false); this._ordersLoaded.set(true); })).subscribe((orders) => this._orders.set(orders)); }
  loadTickets(eventId: string): void { this._loading.set(true); this._error.set(null); this.ticketApi.listByEvent(eventId).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._error.set('Não foi possível carregar os ingressos deste evento no momento.'); return of([]); }), finalize(() => { this._loading.set(false); this._ticketsLoaded.set(true); })).subscribe((tickets) => this._tickets.set(tickets)); }
  loadLogs(eventId: string): void { this._loading.set(true); this._error.set(null); this.accessApi.logs(eventId).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._error.set('Não foi possível carregar os logs de acesso no momento.'); return of([]); }), finalize(() => { this._loading.set(false); this._logsLoaded.set(true); })).subscribe((logs) => this._logs.set(logs)); }
  validateAccess(code: string, gateId: string): void { if (!code.trim() || !gateId.trim()) { this._error.set('Informe o código e o gate para validar o acesso.'); return; } this._loading.set(true); this._error.set(null); const request: ValidateAccessRequestDTO = { qrCodeHash: code.trim(), gateId: gateId.trim() }; this.accessApi.validate(request).pipe(takeUntilDestroyed(this.destroyRef), catchError(() => { this._error.set('Não foi possível validar o acesso no momento.'); return of(null); }), finalize(() => this._loading.set(false))).subscribe((response) => { if (response) { this._validations.update((items) => [this.accessApi.toValidation(code.trim(), response), ...items]); } }); }
  selectEvent(eventId: string | null): void { if (eventId) { this.loadEvent(eventId); this.loadSectors(eventId); } }
  setSearch(value: string): void { this._search.set(value); } setStatus(value: string): void { this._status.set(value); }
}
