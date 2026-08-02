import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, map, of } from 'rxjs';
import { Boxes, ClipboardCheck, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Plus, RefreshCw, Ticket, Users, X } from 'lucide-angular';
import { OrganizerInventoryApi } from '../../data-access/organizer-inventory.api';
import { OrganizerSectorManagementItemViewModel } from '../../organizer.models';
import { OrganizerSectorInventory } from '../../organizer-inventory.models';
import { OrganizerStore } from '../../state/organizer.store';

@Component({
  selector: 'app-organizer-event-inventory',
  imports: [FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Boxes, ClipboardCheck, Plus, RefreshCw, Ticket, Users, X }) }],
  template: `
    <section class="card detail-table-card" aria-label="Inventário dos setores">
      <div class="card-heading"><h2 class="section-title"><lucide-icon name="boxes" size="19" aria-hidden="true"></lucide-icon>Inventário</h2><button class="button secondary" type="button" [disabled]="loading()" (click)="loadInventories()"><lucide-icon name="refresh-cw" size="16" aria-hidden="true"></lucide-icon>Atualizar</button></div>
      @if (loading()) { <p class="muted">Carregando inventários...</p> }
      @else if (!sectors.length) { <p class="muted">Associe um setor ao evento para criar seu inventário.</p> }
      @else { <div class="table-wrap"><table class="event-sector-summary-table"><thead><tr><th><span class="table-heading"><lucide-icon name="boxes" size="15" aria-hidden="true"></lucide-icon>Setor</span></th><th><span class="table-heading"><lucide-icon name="users" size="15" aria-hidden="true"></lucide-icon>Capacidade</span></th><th><span class="table-heading"><lucide-icon name="clipboard-check" size="15" aria-hidden="true"></lucide-icon>Reservados</span></th><th><span class="table-heading"><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon>Vendidos</span></th><th><span class="table-heading"><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon>Disponíveis</span></th><th>Ações</th></tr></thead><tbody>
        @for (sector of sectors; track sector.id) { @let inventory = inventoryFor(sector.id); <tr><td><strong>{{ sector.name }}</strong></td><td>{{ formatQuantity(inventory?.capacity ?? sector.capacity) }}</td><td>{{ formatQuantity(inventory?.reservedQuantity ?? null) }}</td><td>{{ formatQuantity(inventory?.soldQuantity ?? null) }}</td><td>{{ formatQuantity(inventory?.availableQuantity ?? null) }}</td><td>@if (inventory) { <span class="sector-availability">Ativo</span> } @else { <button class="button primary" type="button" (click)="openCreateForm(sector)"><lucide-icon name="plus" size="16" aria-hidden="true"></lucide-icon>Criar inventário</button> }</td></tr> }
      </tbody></table></div> }
      @if (message()) { <p class="notice">{{ message() }}</p> }
    </section>

    @if (sectorForCreation(); as sector) { <div class="sector-confirm-backdrop" role="presentation"><section class="sector-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="create-inventory-title"><div class="card-heading"><h2 id="create-inventory-title">Criar inventário</h2><button class="button secondary" type="button" aria-label="Fechar formulário" (click)="closeCreateForm()"><lucide-icon name="x" size="17" aria-hidden="true"></lucide-icon></button></div><p>Setor: <strong>{{ sector.name }}</strong></p><form style="display:grid;gap:14px" (ngSubmit)="createInventory()"><label><span class="detail-label"><lucide-icon name="users" size="16" aria-hidden="true"></lucide-icon>Capacidade inicial</span><input name="capacity" type="number" min="1" step="1" [(ngModel)]="capacityForCreation" required /></label><div class="actions"><button class="button primary" type="submit" [disabled]="creatingInventory()">{{ creatingInventory() ? 'Salvando...' : 'Salvar inventário' }}</button></div></form></section></div> }
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventInventory implements OnChanges {
  @Input({ required: true }) eventId = '';
  @Input() sectors: readonly OrganizerSectorManagementItemViewModel[] = [];

  private readonly inventoryApi = inject(OrganizerInventoryApi);
  private readonly organizerStore = inject(OrganizerStore);
  protected readonly loading = signal(false);
  protected readonly creatingInventory = signal(false);
  protected readonly inventories = signal<ReadonlyMap<string, OrganizerSectorInventory | null>>(new Map());
  protected readonly sectorForCreation = signal<OrganizerSectorManagementItemViewModel | null>(null);
  protected readonly message = signal<string | null>(null);
  protected capacityForCreation = 0;
  private readonly quantityFormatter = new Intl.NumberFormat('pt-BR');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] || changes['sectors']) {
      this.loadInventories();
    }
  }

  protected loadInventories(): void {
    if (!this.eventId || !this.sectors.length) {
      this.inventories.set(new Map());
      return;
    }

    this.loading.set(true);
    forkJoin(this.sectors.map((sector) => this.inventoryApi.get(this.eventId, sector.id).pipe(map((inventory) => [sector.id, inventory] as const), catchError(() => of([sector.id, null] as const))))).subscribe({
      next: (items) => this.inventories.set(new Map(items)),
      error: () => this.message.set('Não foi possível carregar os inventários no momento.'),
      complete: () => this.loading.set(false),
    });
  }

  protected inventoryFor(sectorId: string): OrganizerSectorInventory | null | undefined { return this.inventories().get(sectorId); }
  protected formatQuantity(value: number | null): string { return value === null ? '—' : this.quantityFormatter.format(value); }
  protected openCreateForm(sector: OrganizerSectorManagementItemViewModel): void { this.message.set(null); this.capacityForCreation = sector.capacity ?? 0; this.sectorForCreation.set(sector); }
  protected closeCreateForm(): void { if (!this.creatingInventory()) { this.sectorForCreation.set(null); } }

  protected createInventory(): void {
    const sector = this.sectorForCreation();
    if (!sector || !this.eventId || this.capacityForCreation < 1) { return; }
    this.creatingInventory.set(true);
    this.inventoryApi.create({ eventId: this.eventId, sectorId: sector.id, capacity: Number(this.capacityForCreation) }).subscribe({
      next: () => { this.message.set('Inventário criado com sucesso.'); this.organizerStore.selectEvent(this.eventId); this.loadInventories(); },
      error: () => { this.message.set('Não foi possível criar o inventário no momento.'); this.creatingInventory.set(false); },
      complete: () => { this.creatingInventory.set(false); this.sectorForCreation.set(null); },
    });
  }
}
