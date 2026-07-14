import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminShell } from '../../components/admin-shell/admin-shell';
import { ScannerStore } from './state/scanner.store';
import { accessResultLabel } from '../../shared/presentation-labels';
import { EventDisplayDataService } from '../../shared/event-display-data.service';

@Component({
  selector: 'app-gate-scanner',
  imports: [AdminShell, LucideAngularModule],
  templateUrl: './gate-scanner.html',
  styleUrl: './gate-scanner.scss',
})
export class GateScanner implements OnInit, OnDestroy {
  readonly store = inject(ScannerStore);
  readonly eventId = signal<string | null>(null);
  readonly eventName = signal('Evento nao informado');
  readonly qrCodeHash = signal('');
  private readonly route = inject(ActivatedRoute);
  private readonly eventDisplayData = inject(EventDisplayDataService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.store.startCamera();
  }

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    this.eventId.set(eventId);
    this.store.setGateId(this.route.snapshot.queryParamMap.get('gateId'));

    if (eventId) {
      this.eventName.set('Carregando evento...');
      this.eventDisplayData
        .getEventData(eventId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (eventData) => this.eventName.set(eventData.event?.name || 'Evento nao identificado'),
          error: () => this.eventName.set('Evento nao identificado'),
        });
    }
  }

  ngOnDestroy(): void {
    this.store.stopCamera();
    this.store.clearSession();
  }

  updateQrCodeHash(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.qrCodeHash.set(input?.value ?? '');
  }

  validateManualCode(): void {
    const code = this.qrCodeHash().trim();

    if (!code) {
      this.store.setError('Informe o codigo de validacao para validar.');
      return;
    }

    this.store.validateCode(code);

    if (!this.store.error()) {
      this.qrCodeHash.set('');
    }
  }

  resultMessage(status: string | null | undefined): string {
    return accessResultLabel(status);
  }
}
