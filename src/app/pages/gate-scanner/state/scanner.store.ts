import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import {
  AccessValidationResponseDTO,
  AccessValidationResultStatus,
  ValidateAccessRequestDTO,
} from '../../../core/models/ticket.model';

const SCAN_COOLDOWN_MS = 1200;

export interface AccessValidationResult {
  readonly code: string;
  readonly status: AccessValidationResultStatus | null;
  readonly isAllowed: boolean;
  readonly message?: string | null;
  readonly sectorName?: string | null;
  readonly ticketId?: string | null;
}

export interface ScannerApi {
  validateAccess(request: ValidateAccessRequestDTO): Observable<AccessValidationResponseDTO>;
}

export const SCANNER_API = new InjectionToken<ScannerApi>('SCANNER_API');

@Injectable()
export class ScannerStore {
  private readonly api = inject(SCANNER_API, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private cooldownUntil = 0;

  private readonly _cameraActive = signal(false);
  private readonly _processing = signal(false);
  private readonly _gateId = signal<string | null>(null);
  private readonly _lastCode = signal<string | null>(null);
  private readonly _lastResult = signal<AccessValidationResult | null>(null);
  private readonly _sessionHistory = signal<AccessValidationResult[]>([]);
  private readonly _error = signal<string | null>(null);

  readonly cameraActive = this._cameraActive.asReadonly();
  readonly processing = this._processing.asReadonly();
  readonly gateId = this._gateId.asReadonly();
  readonly lastCode = this._lastCode.asReadonly();
  readonly lastResult = this._lastResult.asReadonly();
  readonly sessionHistory = this._sessionHistory.asReadonly();
  readonly error = this._error.asReadonly();

  readonly accessGranted = computed(() => this._lastResult()?.isAllowed === true);
  readonly accessDenied = computed(() => {
    const result = this._lastResult();
    return result !== null && !result.isAllowed;
  });
  readonly canScan = computed(() => this._cameraActive() && !this._processing());
  readonly hasResult = computed(() => this._lastResult() !== null);

  startCamera(): void {
    this._cameraActive.set(true);
    this._error.set(null);
  }

  stopCamera(): void {
    this._cameraActive.set(false);
    this._processing.set(false);
  }

  setGateId(gateId: string | null): void {
    this._gateId.set(gateId);
  }

  validateCode(qrCodeHash: string): void {
    const gateId = this._gateId();

    if (!gateId) {
      this._error.set('GateId nao informado para validar o ingresso.');
      return;
    }

    if (!this.api) {
      this._error.set('Integracao de scanner nao configurada.');
      return;
    }

    const now = Date.now();

    if (!this.canScan() || now < this.cooldownUntil) {
      return;
    }

    this._processing.set(true);
    this._lastCode.set(qrCodeHash);
    this._error.set(null);

    this.api
      .validateAccess({ qrCodeHash, gateId })
      .pipe(
        tap((response) => {
          const normalizedResult: AccessValidationResult = {
            code: qrCodeHash,
            status: response.result ?? null,
            isAllowed: response.isAllowed === true,
            message: response.message ?? null,
            sectorName: response.sectorName ?? null,
            ticketId: response.ticketId ?? null,
          };
          this._lastResult.set(normalizedResult);
          this._sessionHistory.update((history) => [normalizedResult, ...history]);
          this.cooldownUntil = Date.now() + SCAN_COOLDOWN_MS;
        }),
        catchError((error: unknown) => {
          this._error.set(this.errorMessage(error, 'Falha de conexao ao validar ingresso.'));
          return of(null);
        }),
        finalize(() => this._processing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearSession(): void {
    this._lastCode.set(null);
    this._lastResult.set(null);
    this._sessionHistory.set([]);
    this._error.set(null);
    this.cooldownUntil = 0;
  }

  setError(message: string): void {
    this._error.set(message);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}
