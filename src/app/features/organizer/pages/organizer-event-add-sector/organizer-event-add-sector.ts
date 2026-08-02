import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizerEventApi } from '../../data-access/organizer-event.api';

@Component({
  selector: 'app-organizer-event-add-sector',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="organizer-page"><header class="page-header"><div><h1>Adicionar setor</h1></div><a class="button secondary" [routerLink]="['/organizer/management/events', eventId, 'sectors']">Voltar</a></header><form class="card field-grid" (ngSubmit)="submit()"><label>ID do setor<input name="sectorId" [(ngModel)]="sectorId" required /></label><label>Preço inteira<input name="basePrice" type="number" min="0" step="0.01" [(ngModel)]="basePrice" required /></label><label>Preço meia<input name="halfPrice" type="number" min="0" step="0.01" [(ngModel)]="halfPrice" required /></label><div class="actions full"><button class="primary" type="submit" [disabled]="loading()">{{ loading() ? 'Adicionando...' : 'Adicionar setor' }}</button></div></form>@if (message()) { <p class="notice">{{ message() }}</p> }</main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventAddSector {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(OrganizerEventApi);
  protected readonly eventId = this.route.snapshot.paramMap.get('eventId') ?? this.route.parent?.snapshot.paramMap.get('eventId') ?? '';
  protected sectorId = '';
  protected basePrice = 0;
  protected halfPrice = 0;
  protected readonly loading = signal(false);
  protected readonly message = signal<string | null>(null);

  protected submit(): void {
    if (!this.eventId || !this.sectorId.trim()) { this.message.set('Informe o ID do evento e do setor.'); return; }
    this.loading.set(true); this.message.set(null);
    this.api.addSector(this.eventId, { sectorId: this.sectorId.trim(), basePrice: Number(this.basePrice), halfPrice: Number(this.halfPrice) }).subscribe({ next: () => this.message.set('Setor adicionado com sucesso.'), error: () => { this.message.set('Não foi possível adicionar o setor no momento.'); this.loading.set(false); }, complete: () => this.loading.set(false) });
  }
}
