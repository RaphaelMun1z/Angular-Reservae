import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccessValidationResponseDTO, ValidateAccessRequestDTO } from '../../../../core/models/ticket.model';
import { ApiUrlService } from '../../../../core/http/api-url.service';
import { ScannerApi } from '../../../../core/http/contracts/scanner.contracts';

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
