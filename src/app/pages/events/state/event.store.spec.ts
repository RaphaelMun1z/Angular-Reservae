import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { EVENT_API, EventApi, EventFilters, EventListItem, EventListResponse, EventStore } from './event.store';

class FakeEventApi implements EventApi {
  supportsEventList?: boolean;
  response: Observable<EventListResponse> = of({
    items: [{ id: 'event-1', name: 'Show A', city: 'Sao Paulo' }],
    total: 1,
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
    expect(store.total()).toBe(1);
  });

  it('should expose load errors', () => {
    api.response = throwError(() => new Error('offline'));

    store.loadEvents();

    expect(store.error()).toContain('offline');
  });

  it('should update filters and reload', () => {
    store.updateFilters({ city: 'Sao Paulo', page: 2 });

    expect(store.filters().city).toBe('Sao Paulo');
    expect(store.filters().page).toBe(2);
    expect(api.filters.length).toBe(1);
  });

  it('should debounce text search', async () => {
    vi.useFakeTimers();
    store.search('s');
    store.search('sh');
    store.search('show');
    await vi.advanceTimersByTimeAsync(299);

    expect(api.filters.length).toBe(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(api.filters.length).toBe(1);
    expect(store.filters().search).toBe('show');
    vi.useRealTimers();
  });

  it('should mark catalog list as pending when backend does not document listing', () => {
    api.supportsEventList = false;

    store.loadEvents();

    expect(store.events()).toEqual([]);
    expect(store.error()).toBeNull();
    expect(store.catalogListPending()).toContain('Listagem de eventos pendente');
  });
});
