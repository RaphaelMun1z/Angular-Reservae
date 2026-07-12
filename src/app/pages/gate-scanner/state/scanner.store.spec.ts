import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AccessValidationResponseDTO } from '../../../core/models/ticket.model';
import { SCANNER_API, ScannerApi, ScannerStore } from './scanner.store';

class FakeScannerApi implements ScannerApi {
  response: Observable<AccessValidationResponseDTO> = of({ isAllowed: true, result: 'GRANTED' });
  calls = 0;

  validateAccess(): Observable<AccessValidationResponseDTO> {
    this.calls += 1;
    return this.response;
  }
}

describe('ScannerStore', () => {
  let store: ScannerStore;
  let api: FakeScannerApi;

  beforeEach(() => {
    api = new FakeScannerApi();
    TestBed.configureTestingModule({
      providers: [ScannerStore, { provide: SCANNER_API, useValue: api }],
    });
    store = TestBed.inject(ScannerStore);
    store.startCamera();
    store.setGateId('gate-1');
  });

  it('should block concurrent scans', () => {
    const pendingResult = new Subject<AccessValidationResponseDTO>();
    api.response = pendingResult.asObservable();

    store.validateCode('qr-1');
    store.validateCode('qr-2');

    expect(api.calls).toBe(1);
  });

  it('should not validate without gateId', () => {
    store.setGateId(null);

    store.validateCode('qr-1');

    expect(api.calls).toBe(0);
    expect(store.error()).toContain('GateId nao informado');
  });

  it('should expose granted result', () => {
    store.validateCode('qr-1');

    expect(store.accessGranted()).toBe(true);
    expect(store.hasResult()).toBe(true);
  });

  it('should expose denied result', () => {
    api.response = of({ isAllowed: false, result: 'DENIED_USED' });

    store.validateCode('qr-1');

    expect(store.accessDenied()).toBe(true);
  });

  it('should expose network errors separately from validation results', () => {
    api.response = throwError(() => new Error('offline'));

    store.validateCode('qr-1');

    expect(store.error()).toContain('offline');
    expect(store.lastResult()).toBeNull();
  });

  it('should clear the scan session', () => {
    store.validateCode('qr-1');
    store.clearSession();

    expect(store.sessionHistory()).toEqual([]);
    expect(store.lastCode()).toBeNull();
  });
});
