import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiUrlService } from '../../../core/http/api-url.service';
import { OrganizerOrderViewModel } from '../organizer.models';

const ORDERS_PATH = '/order-service/api/orders/v1';

@Injectable({ providedIn: 'root' })
export class OrganizerOrderApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  listByEvent(eventId: string): Observable<readonly OrganizerOrderViewModel[]> {
    return this.http.get<unknown>(this.apiUrl.url(`${ORDERS_PATH}/event/${encodeURIComponent(eventId)}/orders`)).pipe(
      map((response) => this.toOrders(response)),
    );
  }

  private toOrders(response: unknown): readonly OrganizerOrderViewModel[] {
    const values = Array.isArray(response) ? response : this.record(response)?.['content'];
    return Array.isArray(values) ? values.filter((value): value is Record<string, unknown> => this.record(value) !== null).map((value) => ({
      id: this.string(value['id'] ?? value['orderId']) ?? 'Pedido sem identificador',
      status: this.string(value['status']),
      totalAmount: this.number(value['totalAmount'] ?? value['total'] ?? value['amount']),
      createdAt: this.string(value['createdAt'] ?? value['createdDate']),
      itemsCount: Array.isArray(value['items']) ? value['items'].length : this.number(value['itemsCount']),
      sectorNames: this.sectorNames(value['items']),
    })) : [];
  }

  private sectorNames(value: unknown): readonly string[] { return Array.isArray(value) ? value.map((item) => this.record(item)?.['sectorName']).filter((name): name is string => typeof name === 'string') : []; }
  private record(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null; }
  private string(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value : null; }
  private number(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
}
