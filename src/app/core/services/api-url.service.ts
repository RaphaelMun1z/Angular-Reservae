import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiUrlService {
  url(path: string): string {
    return `${environment.apiGatewayUrl}${path}`;
  }
}
