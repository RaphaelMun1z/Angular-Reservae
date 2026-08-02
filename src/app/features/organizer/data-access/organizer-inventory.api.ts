import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiUrlService } from '../../../core/http/api-url.service';
import { CreateOrganizerSectorInventoryRequest, OrganizerSectorInventory } from '../organizer-inventory.models';

const INVENTORY_PATH = '/inventory-service/api/inventory/v1';

@Injectable({ providedIn: 'root' })
export class OrganizerInventoryApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  get(eventId: string, sectorId: string): Observable<OrganizerSectorInventory> {
    return this.http.get<unknown>(this.apiUrl.url(`${INVENTORY_PATH}/event/${eventId}/sector/${sectorId}`)).pipe(map((response) => this.toInventory(response, eventId, sectorId)));
  }

  create(request: CreateOrganizerSectorInventoryRequest): Observable<OrganizerSectorInventory> {
    return this.http.post<unknown>(this.apiUrl.url(`${INVENTORY_PATH}/event-sector`), request).pipe(map((response) => this.toInventory(response, request.eventId, request.sectorId)));
  }

  private toInventory(response: unknown, eventId: string, sectorId: string): OrganizerSectorInventory {
    const item = this.isRecord(response) ? response : {};
    return {
      eventId: this.string(item['eventId']) ?? eventId,
      sectorId: this.string(item['sectorId']) ?? sectorId,
      capacity: this.number(item['capacity']),
      reservedQuantity: this.number(item['reservedQuantity']),
      soldQuantity: this.number(item['soldQuantity']),
      availableQuantity: this.number(item['availableQuantity']),
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
  private string(value: unknown): string | null { return typeof value === 'string' ? value : null; }
  private number(value: unknown): number | null { return typeof value === 'number' ? value : null; }
}
