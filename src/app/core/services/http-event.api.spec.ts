import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpEventApi } from './http-event.api';

describe('HttpEventApi', () => {
  let api: HttpEventApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpEventApi],
    });

    api = TestBed.inject(HttpEventApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should get event details by id', () => {
    api.getEvent('event-1').subscribe((event) => {
      expect(event.id).toBe('event-1');
      expect(event.name).toBe('Show A');
      expect(event.city).toBe('Sao Paulo');
    });

    const req = http.expectOne('http://localhost:8765/event-catalog-service/api/events/v1/event-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      eventId: 'event-1',
      title: 'Show A',
      eventDate: '2026-08-01T20:00:00Z',
      status: 'SCHEDULED',
      venueCity: 'Sao Paulo',
    });
  });

  it('should consult ticket prices with sector id array body', () => {
    api.consultTicketPrices('event-1', ['sector-1']).subscribe((prices) => {
      expect(prices[0]?.basePrice).toBe(80);
    });

    const req = http.expectOne(
      'http://localhost:8765/event-catalog-service/api/events/v1/event-1/sectors/prices',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['sector-1']);
    req.flush([{ sectorId: 'sector-1', sectorName: 'Pista', basePrice: 80, halfPrice: 40 }]);
  });

  it('should load sectors and enrich availability from inventory-service', () => {
    api.listSectors('event-1').subscribe((sectors) => {
      expect(sectors[0]?.id).toBe('sector-1');
      expect(sectors[0]?.availableQuantity).toBe(42);
    });

    const eventReq = http.expectOne('http://localhost:8765/event-catalog-service/api/events/v1/event-1');
    expect(eventReq.request.method).toBe('GET');
    eventReq.flush({
      eventId: 'event-1',
      sectorsDetails: [
        {
          eventId: 'event-1',
          sectorId: 'sector-1',
          sectorName: 'Pista',
          sectorBasePrice: 80,
          sectorHalfPrice: 40,
          totalCapacity: 100,
        },
      ],
    });

    const inventoryReq = http.expectOne(
      'http://localhost:8765/inventory-service/api/inventory/v1/event/event-1/sector/sector-1',
    );
    expect(inventoryReq.request.method).toBe('GET');
    inventoryReq.flush({ eventId: 'event-1', sectorId: 'sector-1', availableQuantity: 42 });
  });
});
