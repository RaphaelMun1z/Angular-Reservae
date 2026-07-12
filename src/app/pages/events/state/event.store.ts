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
  readonly state: string | null;
  readonly status: EventStatus | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
}

export interface EventListResponse {
  readonly items: readonly EventListItem[];
  readonly totalElements: number;
  readonly totalPages: number;
  readonly size: number;
  readonly number: number;
  readonly numberOfElements: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly empty: boolean;
}

export interface EventApi {
  readonly supportsEventList?: boolean;
  listEvents(filters: EventFilters): Observable<EventListResponse>;
  getEvent(eventId: string): Observable<EventListItem>;
  listSectors(eventId: string): Observable<readonly EventSector[]>;
}

export const EVENT_API = new InjectionToken<EventApi>('EVENT_API');

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_SORT = 'eventDate,asc';

const initialFilters: EventFilters = {
  search: '',
  city: null,
  state: null,
  status: null,
  startDate: null,
  endDate: null,
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  sort: DEFAULT_SORT,
};

@Injectable()
export class EventStore {
  private readonly api = inject(EVENT_API, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  private readonly _events = signal<EventListItem[]>([]);
  private readonly _featuredEvents = signal<EventListItem[]>([]);
  private readonly _selectedEvent = signal<EventListItem | null>(null);
  private readonly _sectors = signal<EventSector[]>([]);
  private readonly _filters = signal<EventFilters>(initialFilters);
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _numberOfElements = signal(0);
  private readonly _first = signal(true);
  private readonly _last = signal(true);
  private readonly _empty = signal(true);
  private readonly _loading = signal(false);
  private readonly _featuredLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _featuredError = signal<string | null>(null);

  readonly events = this._events.asReadonly();
  readonly featuredEvents = this._featuredEvents.asReadonly();
  readonly selectedEvent = this._selectedEvent.asReadonly();
  readonly sectors = this._sectors.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly total = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly numberOfElements = this._numberOfElements.asReadonly();
  readonly first = this._first.asReadonly();
  readonly last = this._last.asReadonly();
  readonly empty = this._empty.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly featuredLoading = this._featuredLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly featuredError = this._featuredError.asReadonly();

  readonly hasEvents = computed(() => this._events().length > 0);
  readonly hasFeaturedEvents = computed(() => this._featuredEvents().length > 0);
  readonly featuredEmpty = computed(() => !this._featuredLoading() && this._featuredEvents().length === 0);
  readonly hasSectors = computed(() => this._sectors().length > 0);
  readonly currentPage = computed(() => this._filters().page);
  readonly currentUiPage = computed(() => this._filters().page + 1);
  readonly pageSize = computed(() => this._filters().size);
  readonly sort = computed(() => this._filters().sort);
  readonly filteredEvents = this.events;
  readonly catalogListPending = computed(() => null);

  constructor() {
    this.searchTerms
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap((search) => this.patchFilters({ search: search.trim(), page: 0 }, false)),
        switchMap(() => this.loadEventsRequest()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadEvents(): void {
    this.loadEventsRequest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  loadFeaturedEvents(): void {
    this.loadFeaturedEventsRequest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  search(search: string): void {
    this.searchByTitle(search);
  }

  searchByTitle(search: string): void {
    this.searchTerms.next(search);
  }

  updateFilters(filters: Partial<EventFilters>): void {
    this.patchFilters({ ...filters, page: 0 }, true);
  }

  clearFilters(): void {
    this._filters.set(initialFilters);
    this.loadEvents();
  }

  changePage(page: number): void {
    const boundedPage = Math.max(0, Math.min(page, Math.max(this._totalPages() - 1, 0)));
    this.patchFilters({ page: boundedPage }, true);
  }

  changePageSize(size: number): void {
    const normalizedSize = Number.isFinite(size) && size > 0 ? size : DEFAULT_PAGE_SIZE;
    this.patchFilters({ size: normalizedSize, page: 0 }, true);
  }

  markCatalogListPending(): void {
    this.loadEvents();
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
    this._filters.update((currentFilters) => this.normalizeFilters({ ...currentFilters, ...filters }));

    if (shouldLoad) {
      this.loadEvents();
    }
  }

  private loadEventsRequest(): Observable<EventListResponse | null> {
    if (!this.api) {
      this._error.set('Integracao de eventos nao configurada.');
      return of(null);
    }

    const filters = this._filters();
    if (!this.isValidDateRange(filters)) {
      this._events.set([]);
      this._totalElements.set(0);
      this._totalPages.set(0);
      this._numberOfElements.set(0);
      this._first.set(true);
      this._last.set(true);
      this._empty.set(true);
      this._error.set('A data inicial nao pode ser posterior a data final.');
      return of(null);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.api.listEvents(filters).pipe(
      tap((response) => {
        this._events.set(response.items.map((event) => ({ ...event })));
        this._totalElements.set(response.totalElements);
        this._totalPages.set(response.totalPages);
        this._numberOfElements.set(response.numberOfElements);
        this._first.set(response.first);
        this._last.set(response.last);
        this._empty.set(response.empty);
        this._filters.update((currentFilters) => ({ ...currentFilters, page: response.number, size: response.size }));
      }),
      catchError((error: unknown) => {
        this._events.set([]);
        this._totalElements.set(0);
        this._totalPages.set(0);
        this._numberOfElements.set(0);
        this._first.set(true);
        this._last.set(true);
        this._empty.set(true);
        this._error.set(this.errorMessage(error, 'Nao foi possivel carregar eventos.'));
        return of(null);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private loadFeaturedEventsRequest(): Observable<EventListResponse | null> {
    if (!this.api) {
      this._featuredError.set('Nao foi possivel carregar os eventos.');
      return of(null);
    }

    this._featuredLoading.set(true);
    this._featuredError.set(null);

    return this.api
      .listEvents({
        ...initialFilters,
        status: 'SCHEDULED',
        page: 0,
        size: 6,
        sort: DEFAULT_SORT,
      })
      .pipe(
        tap((response) => this._featuredEvents.set(response.items.map((event) => ({ ...event })))),
        catchError(() => {
          this._featuredEvents.set([]);
          this._featuredError.set('Nao foi possivel carregar os eventos.');
          return of(null);
        }),
        finalize(() => this._featuredLoading.set(false)),
      );
  }

  private normalizeFilters(filters: EventFilters): EventFilters {
    return {
      search: filters.search.trim(),
      city: this.optionalString(filters.city),
      state: this.optionalString(filters.state)?.toUpperCase() ?? null,
      status: filters.status,
      startDate: this.toStartDateTime(filters.startDate),
      endDate: this.toEndDateTime(filters.endDate),
      page: Math.max(0, filters.page),
      size: filters.size > 0 ? filters.size : DEFAULT_PAGE_SIZE,
      sort: filters.sort.trim() || DEFAULT_SORT,
    };
  }

  private optionalString(value: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private toStartDateTime(value: string | null): string | null {
    const date = this.optionalString(value);
    return date ? `${date.slice(0, 10)}T00:00:00` : null;
  }

  private toEndDateTime(value: string | null): string | null {
    const date = this.optionalString(value);
    return date ? `${date.slice(0, 10)}T23:59:59` : null;
  }

  private isValidDateRange(filters: EventFilters): boolean {
    if (!filters.startDate || !filters.endDate) {
      return true;
    }

    return filters.startDate <= filters.endDate;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
