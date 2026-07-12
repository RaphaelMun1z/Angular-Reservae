import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpScannerApi } from './http-scanner.api';

describe('HttpScannerApi', () => {
  let api: HttpScannerApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpScannerApi],
    });

    api = TestBed.inject(HttpScannerApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should validate access using qrCodeHash and gateId', () => {
    const request = { qrCodeHash: 'hash-1', gateId: 'gate-1' };

    api.validateAccess(request).subscribe((response) => {
      expect(response.isAllowed).toBe(true);
      expect(response.result).toBe('GRANTED');
    });

    const req = http.expectOne('http://localhost:8765/ticket-service/api/tickets/access/v1/validate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ isAllowed: true, result: 'GRANTED', message: 'OK' });
  });
});
