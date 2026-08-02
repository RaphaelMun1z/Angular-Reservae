import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiUrlService } from '../../../core/http/api-url.service';
import { OrganizerVenue } from '../organizer-venue.models';

const VENUE_CATALOG_PATH = '/event-catalog-service/api/venues/v1';

@Injectable({ providedIn: 'root' })
export class OrganizerVenueApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  list(city?: string, state?: string): Observable<readonly OrganizerVenue[]> {
    let params = new HttpParams();
    if (city?.trim()) params = params.set('city', city.trim());
    if (state?.trim()) params = params.set('state', state.trim());
    return this.http.get<unknown>(this.apiUrl.url(VENUE_CATALOG_PATH), { params }).pipe(map((response) => this.toList(response)));
  }

  listByLocation(city: string, state: string): Observable<readonly OrganizerVenue[]> {
    const params = new HttpParams().set('city', city.trim()).set('state', state.trim());
    return this.http.get<unknown>(this.apiUrl.url(`${VENUE_CATALOG_PATH}/filter-by-location`), { params }).pipe(map((response) => this.toList(response)));
  }

  get(venueId: string): Observable<OrganizerVenue> {
    return this.http.get<unknown>(this.apiUrl.url(`${VENUE_CATALOG_PATH}/${venueId}`)).pipe(map((response) => this.toVenue(response)));
  }

  addSector(venueId: string, request: { readonly name: string; readonly capacity: number }): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl.url(`${VENUE_CATALOG_PATH}/${venueId}/add-sector`), request);
  }

  removeSector(venueId: string, sectorId: string): Observable<unknown> {
    return this.http.delete<unknown>(this.apiUrl.url(`${VENUE_CATALOG_PATH}/${venueId}/remove-sector/${sectorId}`));
  }

  private toList(response: unknown): readonly OrganizerVenue[] {
    if (Array.isArray(response)) return response.map((item) => this.toVenue(item));
    if (this.isRecord(response) && Array.isArray(response['content'])) return response['content'].map((item) => this.toVenue(item));
    return [];
  }

  private toVenue(value: unknown): OrganizerVenue {
    const item = this.isRecord(value) ? value : {};
    const sectors = Array.isArray(item['sectors']) ? item['sectors'].map((sector) => this.toSector(sector)) : [];
    return {
      id: this.string(item['id'] ?? item['venueId']), name: this.string(item['name']), city: this.optionalString(item['city']), state: this.optionalString(item['state']),
      totalCapacity: this.number(item['totalCapacity']), sectors,
    };
  }

  private toSector(value: unknown): OrganizerVenue['sectors'][number] {
    const item = this.isRecord(value) ? value : {};
    return { id: this.string(item['id'] ?? item['sectorId']), name: this.string(item['name'] ?? item['sectorName']), capacity: this.number(item['capacity']), price: this.number(item['price'] ?? item['basePrice']) };
  }

  private isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
  private string(value: unknown): string { return typeof value === 'string' ? value : ''; }
  private optionalString(value: unknown): string | null { return typeof value === 'string' ? value : null; }
  private number(value: unknown): number | null { return typeof value === 'number' ? value : null; }
}
