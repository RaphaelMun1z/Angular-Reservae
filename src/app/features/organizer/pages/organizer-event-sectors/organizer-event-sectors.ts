import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CircleDollarSign, Layers, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Ticket, Trash2, Users } from 'lucide-angular';
import { OrganizerEventApi } from '../../data-access/organizer-event.api';
import { OrganizerStore } from '../../state/organizer.store';
import { OrganizerSectorManagementItemViewModel } from '../../organizer.models';

@Component({
  selector: 'app-organizer-event-sectors',
  imports: [RouterLink, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ CircleDollarSign, Layers, Ticket, Trash2, Users }) }],
  template: `
    <main class="organizer-page">
      <header class="page-header">
        <div><h1>Setores e disponibilidade</h1></div>
        <a class="button secondary" [routerLink]="['/organizer/management/events', eventId]">Voltar</a>
      </header>
      @if (store.loading()) {
        <p class="card">Carregando setores...</p>
      } @else if (store.error()) {
        <p class="notice">{{ store.error() }}</p>
      } @else if (!orderedSectors().length) {
        <p class="card">Nenhum setor disponível para este evento.</p>
      } @else {
        <section class="card table-wrap sector-table-card">
          <table class="sector-table">
            <thead><tr><th><span><lucide-icon name="layers" size="15" aria-hidden="true"></lucide-icon>Setor</span></th><th><span><lucide-icon name="users" size="15" aria-hidden="true"></lucide-icon>Capacidade</span></th><th><span><lucide-icon name="circle-dollar-sign" size="15" aria-hidden="true"></lucide-icon>Inteira</span></th><th><span><lucide-icon name="circle-dollar-sign" size="15" aria-hidden="true"></lucide-icon>Meia</span></th><th><span><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon>Disponíveis</span></th><th>Ações</th></tr></thead>
            <tbody>
              @for (sector of orderedSectors(); track sector.id) {
                <tr>
                  <td><div class="sector-name"><lucide-icon name="layers" size="17" aria-hidden="true"></lucide-icon><strong>{{ sector.name }}</strong></div></td>
                  <td>{{ formatQuantity(sector.capacity) }}</td>
                  <td><strong class="sector-price">{{ formatPrice(sector.fullPrice) }}</strong></td>
                  <td>{{ formatPrice(sector.halfPrice) }}</td>
                  <td><span class="sector-availability"><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon>{{ formatQuantity(sector.available) }}</span></td>
                  <td class="sector-actions-cell"><button class="sector-remove-button sector-icon-button" type="button" [disabled]="removingSectorId() === sector.id || hasIssuedTickets(sector)" [attr.aria-label]="hasIssuedTickets(sector) ? 'Setor não pode ser removido pois possui ingressos' : 'Remover setor ' + sector.name" [attr.title]="hasIssuedTickets(sector) ? 'Não é possível remover: há ingressos reservados ou vendidos' : 'Remover setor'" (click)="requestRemoval(sector)"><lucide-icon name="trash-2" size="16" aria-hidden="true"></lucide-icon></button></td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
      @if (message()) { <p class="notice">{{ message() }}</p> }
      <a class="button primary" style="margin-top:16px" [routerLink]="['/organizer/management/events', eventId, 'add-sector']">Adicionar setor</a>
      @if (sectorPendingRemoval(); as sector) {
        <div class="sector-confirm-backdrop" role="presentation">
          <section class="sector-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-sector-title">
            <lucide-icon name="trash-2" size="22" aria-hidden="true"></lucide-icon>
            <h2 id="remove-sector-title">Remover setor?</h2>
            <p>Tem certeza que deseja remover o setor <strong>{{ sector.name }}</strong>? Esta ação não pode ser desfeita.</p>
            <div class="sector-confirm-actions"><button class="button secondary" type="button" [disabled]="removingSectorId() !== null" (click)="cancelRemoval()">Cancelar</button><button class="button sector-remove-button" type="button" [disabled]="removingSectorId() !== null" (click)="confirmRemoval()">{{ removingSectorId() ? 'Removendo...' : 'Remover setor' }}</button></div>
          </section>
        </div>
      }
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventSectors implements OnInit {
  protected readonly route = inject(ActivatedRoute);
  protected readonly store = inject(OrganizerStore);
  private readonly eventApi = inject(OrganizerEventApi);
  protected readonly eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
  protected readonly orderedSectors = computed(() => [...this.store.sectors()].sort((first, second) => (second.fullPrice ?? Number.NEGATIVE_INFINITY) - (first.fullPrice ?? Number.NEGATIVE_INFINITY)));
  protected readonly removingSectorId = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly sectorPendingRemoval = signal<{ readonly id: string; readonly name: string } | null>(null);
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly quantityFormatter = new Intl.NumberFormat('pt-BR');

  ngOnInit(): void {
    if (this.eventId) {
      this.store.loadSectors(this.eventId);
    }
  }

  protected formatPrice(value: number | null): string {
    return value === null ? 'Indisponível' : this.currencyFormatter.format(value);
  }

  protected formatQuantity(value: number | null): string {
    return value === null ? 'Indisponível' : this.quantityFormatter.format(value);
  }

  protected hasIssuedTickets(sector: OrganizerSectorManagementItemViewModel): boolean { return (sector.reservedQuantity ?? 0) > 0 || (sector.soldQuantity ?? 0) > 0; }

  protected requestRemoval(sector: OrganizerSectorManagementItemViewModel): void {
    if (!this.eventId) {
      return;
    }

    if (this.hasIssuedTickets(sector)) {
      this.message.set('Este setor não pode ser removido porque possui ingressos reservados ou vendidos.');
      return;
    }

    this.sectorPendingRemoval.set({ id: sector.id, name: sector.name });
  }

  protected cancelRemoval(): void {
    this.sectorPendingRemoval.set(null);
  }

  protected confirmRemoval(): void {
    const sector = this.sectorPendingRemoval();
    if (!this.eventId || !sector) {
      return;
    }

    const currentSector = this.store.sectors().find((item) => item.id === sector.id);
    if (currentSector && this.hasIssuedTickets(currentSector)) {
      this.message.set('Este setor não pode ser removido porque possui ingressos reservados ou vendidos.');
      this.sectorPendingRemoval.set(null);
      return;
    }

    this.removingSectorId.set(sector.id);
    this.message.set(null);
    this.eventApi.removeSector(this.eventId, sector.id).subscribe({
      next: () => {
        this.message.set('Setor removido com sucesso.');
        this.store.loadSectors(this.eventId);
      },
      error: () => {
        this.message.set('Não foi possível remover o setor no momento.');
        this.removingSectorId.set(null);
        this.sectorPendingRemoval.set(null);
      },
      complete: () => {
        this.removingSectorId.set(null);
        this.sectorPendingRemoval.set(null);
      },
    });
  }
}
