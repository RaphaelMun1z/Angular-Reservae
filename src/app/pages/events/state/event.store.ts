import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap, tap } from 'rxjs/operators';
import { EventStatus } from '../../../core/models/event-catalog.model';

export interface EventListItem {
  readonly id: string;
  readonly name: string;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly date?: string | null;
  readonly status?: EventStatus | null;
  readonly venueName?: string | null;
}

export interface EventSector {
  readonly id: string;
  readonly name: string;
  readonly basePrice?: number | null;
  readonly halfPrice?: number | null;
  readonly totalCapacity?: number | null;
  readonly availableQuantity?: number | null;
}

export interface EventFilters {
  readonly search: string;
  readonly city: string | null;
  readonly date: string | null;
  readonly sort: string | null;
  readonly page: number;
}

export interface EventListResponse {
  readonly items: readonly EventListItem[];
  readonly total: number;
}

export interface EventApi {
  readonly supportsEventList?: boolean;
  listEvents(filters: EventFilters): Observable<EventListResponse>;
  getEvent(eventId: string): Observable<EventListItem>;
  listSectors(eventId: string): Observable<readonly EventSector[]>;
}

export const EVENT_API = new InjectionToken<EventApi>('EVENT_API');

const initialFilters: EventFilters = {
  search: '',
  city: null,
  date: null,
  sort: null,
  page: 1,
};

@Injectable()
export class EventStore {
  private readonly api = inject(EVENT_API, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  private readonly _events = signal<EventListItem[]>([]);
  private readonly _selectedEvent = signal<EventListItem | null>(null);
  private readonly _sectors = signal<EventSector[]>([]);
  private readonly _filters = signal<EventFilters>(initialFilters);
  private readonly _total = signal(0);
  private readonly _catalogListPending = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly events = this._events.asReadonly();
  readonly selectedEvent = this._selectedEvent.asReadonly();
  readonly sectors = this._sectors.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly total = this._total.asReadonly();
  readonly catalogListPending = this._catalogListPending.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasEvents = computed(() => this._events().length > 0);
  readonly hasSectors = computed(() => this._sectors().length > 0);
  readonly currentPage = computed(() => this._filters().page);
  readonly filteredEvents = computed(() => {
    const filters = this._filters();

    return this._events().filter((event) => {
      const matchesSearch =
        !filters.search || event.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCity = !filters.city || event.city === filters.city;
      const matchesDate = !filters.date || event.date === filters.date;

      return matchesSearch && matchesCity && matchesDate;
    });
  });

  constructor() {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((search) => this.patchFilters({ search, page: 1 }, false)),
        switchMap(() => this.loadEventsRequest()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadEvents(): void {
    this.loadEventsRequest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  search(search: string): void {
    this.searchTerms.next(search);
  }

  updateFilters(filters: Partial<EventFilters>): void {
    this.patchFilters(filters, true);
  }

  markCatalogListPending(): void {
    this._events.set([]);
    this._total.set(0);
    this._error.set(null);
    this._catalogListPending.set(
      'O catalogo completo ainda nao esta disponivel porque o backend nao documenta a listagem de eventos.',
    );
  }

  selectEvent(event: EventListItem | null): void {
    this._selectedEvent.set(event ? { ...event } : null);
  }

  loadEvent(eventId: string): void {
    if (!this.api) {
      this._error.set('Integracao de eventos nao configurada.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .getEvent(eventId)
      .pipe(
        tap((event) => this._selectedEvent.set({ ...event })),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel carregar o evento.'));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadSectors(eventId: string): void {
    if (!this.api) {
      this._error.set('Integracao de eventos nao configurada.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api
      .listSectors(eventId)
      .pipe(
        tap((sectors) => this._sectors.set(sectors.map((sector) => ({ ...sector })))),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Nao foi possivel carregar os setores.'));
          return of([]);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearSelection(): void {
    this._selectedEvent.set(null);
    this._sectors.set([]);
  }

  private patchFilters(filters: Partial<EventFilters>, shouldLoad: boolean): void {
    this._filters.update((currentFilters) => ({ ...currentFilters, ...filters }));

    if (shouldLoad) {
      this.loadEvents();
    }
  }

  private loadEventsRequest(): Observable<EventListResponse | null> {
    if (!this.api) {
      this._error.set('Integracao de eventos nao configurada.');
      return of(null);
    }

    if (this.api.supportsEventList === false) {
      this._events.set([]);
      this._total.set(0);
      this._error.set(null);
      this._catalogListPending.set(
        'Listagem de eventos pendente: o OpenAPI do event-catalog-service nao documenta este endpoint.',
      );
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);
    this._catalogListPending.set(null);

    return this.api.listEvents(this._filters()).pipe(
      tap((response) => {
        this._events.set(response.items.map((event) => ({ ...event })));
        this._total.set(response.total);
      }),
      catchError((error: unknown) => {
        this._error.set(this.errorMessage(error, 'Nao foi possivel carregar eventos.'));
        return of(null);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
