import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { EVENT_API, EventApi, EventFilters, EventListItem, EventListResponse, EventStore } from './event.store';

class FakeEventApi implements EventApi {
  supportsEventList?: boolean;
  response: Observable<EventListResponse> = of({
    items: [{ id: 'event-1', name: 'Show A', city: 'Sao Paulo' }],
    totalElements: 1,
    totalPages: 1,
    size: 12,
    number: 0,
    numberOfElements: 1,
    first: true,
    last: true,
    empty: false,
  });

  filters: EventFilters[] = [];

  listEvents(filters: EventFilters): Observable<EventListResponse> {
    this.filters.push(filters);
    return this.response;
  }

  getEvent(): Observable<EventListItem> {
    return of({ id: 'event-1', name: 'Show A' });
  }

  listSectors(): Observable<[]> {
    return of([]);
  }
}

describe('EventStore', () => {
  let store: EventStore;
  let api: FakeEventApi;

  beforeEach(() => {
    api = new FakeEventApi();
    TestBed.configureTestingModule({
      providers: [EventStore, { provide: EVENT_API, useValue: api }],
    });
    store = TestBed.inject(EventStore);
  });

  it('should load events successfully', () => {
    store.loadEvents();

    expect(store.loading()).toBe(false);
    expect(store.events().length).toBe(1);
    expect(store.totalElements()).toBe(1);
  });

  it('should expose load errors', () => {
    api.response = throwError(() => new Error('offline'));

    store.loadEvents();

    expect(store.error()).toContain('offline');
  });

  it('should update filters and reload', () => {
    store.updateFilters({ city: 'Sao Paulo', page: 2 });

    expect(store.filters().city).toBe('Sao Paulo');
    expect(store.filters().page).toBe(0);
    expect(api.filters.length).toBe(1);
  });

  it('should debounce text search', async () => {
    vi.useFakeTimers();
    store.search('s');
    store.search('sh');
    store.search('show');
    await vi.advanceTimersByTimeAsync(399);

    expect(api.filters.length).toBe(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(api.filters.length).toBe(1);
    expect(store.filters().search).toBe('show');
    vi.useRealTimers();
  });

  it('should change backend page using zero-based indexes', () => {
    api.response = of({
      items: [],
      totalElements: 24,
      totalPages: 2,
      size: 12,
      number: 1,
      numberOfElements: 12,
      first: false,
      last: true,
      empty: false,
    });

    store.loadEvents();
    store.changePage(1);

    expect(api.filters[1].page).toBe(1);
    expect(store.currentUiPage()).toBe(2);
  });
});
