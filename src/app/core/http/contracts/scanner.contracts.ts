import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AccessValidationResponseDTO, ValidateAccessRequestDTO } from '../../models/ticket.model';

export interface ScannerApi {
  validateAccess(request: ValidateAccessRequestDTO): Observable<AccessValidationResponseDTO>;
}

export const SCANNER_API = new InjectionToken<ScannerApi>('SCANNER_API');
