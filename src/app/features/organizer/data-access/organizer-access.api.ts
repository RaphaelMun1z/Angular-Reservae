import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiUrlService } from '../../../core/http/api-url.service';
import { AccessValidationResponseDTO, ValidateAccessRequestDTO } from '../../../core/models/ticket.model';
import { OrganizerAccessLogViewModel, OrganizerCheckinValidationViewModel } from '../organizer.models';

const ACCESS_PATH = '/ticket-service/api/tickets/access/v1';

@Injectable({ providedIn: 'root' })
export class OrganizerAccessApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  validate(request: ValidateAccessRequestDTO): Observable<AccessValidationResponseDTO> { return this.http.post<AccessValidationResponseDTO>(this.apiUrl.url(`${ACCESS_PATH}/validate`), request); }
  logs(eventId: string): Observable<readonly OrganizerAccessLogViewModel[]> {
    return this.http.get<unknown>(this.apiUrl.url(`${ACCESS_PATH}/logs`), { params: { eventId } }).pipe(map((response) => this.toLogs(response)));
  }

  toValidation(code: string, response: AccessValidationResponseDTO): OrganizerCheckinValidationViewModel { return { code, isAllowed: response.isAllowed === true, result: response.result ?? null, message: response.message ?? null, ticketId: response.ticketId ?? null, sectorName: response.sectorName ?? null }; }
  private toLogs(response: unknown): readonly OrganizerAccessLogViewModel[] {
    const values = Array.isArray(response) ? response : this.record(response)?.['content'];
    return Array.isArray(values) ? values.filter((value): value is Record<string, unknown> => this.record(value) !== null).map((value) => ({ id: this.string(value['id'] ?? value['logId']) ?? 'Log sem identificador', gateId: this.string(value['gateId']), result: this.string(value['result']), createdAt: this.string(value['createdAt'] ?? value['createdDate']), ticketId: this.string(value['ticketId']) })) : [];
  }
  private record(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null; }
  private string(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value : null; }
}
