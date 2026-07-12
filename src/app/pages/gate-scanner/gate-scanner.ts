import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminShell } from '../../components/admin-shell/admin-shell';
import { ScannerStore } from './state/scanner.store';

@Component({
  selector: 'app-gate-scanner',
  imports: [AdminShell, LucideAngularModule],
  templateUrl: './gate-scanner.html',
  styleUrl: './gate-scanner.scss',
})
export class GateScanner implements OnInit, OnDestroy {
  readonly store = inject(ScannerStore);
  readonly eventId = signal<string | null>(null);
  readonly qrCodeHash = signal('');
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.store.startCamera();
  }

  ngOnInit(): void {
    this.eventId.set(this.route.snapshot.paramMap.get('eventId'));
    this.store.setGateId(this.route.snapshot.queryParamMap.get('gateId'));
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
      this.store.setError('Informe o qrCodeHash para validar.');
      return;
    }

    this.store.validateCode(code);

    if (!this.store.error()) {
      this.qrCodeHash.set('');
    }
  }

  resultMessage(status: string | null | undefined): string {
    switch (status) {
      case 'GRANTED':
        return 'Acesso permitido';
      case 'DENIED_USED':
        return 'Ingresso ja utilizado';
      case 'DENIED_REVOKED':
        return 'Ingresso revogado';
      case 'DENIED_INVALID':
        return 'Ingresso invalido';
      default:
        return 'Aguardando validacao';
    }
  }
}
