import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccessValidationResponseDTO, ValidateAccessRequestDTO } from '../models/ticket.model';
import { ApiUrlService } from './api-url.service';
import { ScannerApi } from '../../pages/gate-scanner/state/scanner.store';

const ACCESS_PATH = '/ticket-service/api/tickets/access/v1';

@Injectable({
  providedIn: 'root',
})
export class HttpScannerApi implements ScannerApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  validateAccess(request: ValidateAccessRequestDTO): Observable<AccessValidationResponseDTO> {
    return this.http.post<AccessValidationResponseDTO>(
      this.apiUrl.url(`${ACCESS_PATH}/validate`),
      request,
    );
  }
}
