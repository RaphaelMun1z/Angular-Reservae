import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { forkJoin, catchError, map, of } from 'rxjs';
import {
  Boxes,
  ClipboardCheck,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  RefreshCw,
  Ticket,
  Users,
} from 'lucide-angular';
import { OrganizerInventoryApi } from '../../data-access/organizer-inventory.api';
import { OrganizerSectorManagementItemViewModel } from '../../organizer.models';
import { OrganizerSectorInventory } from '../../organizer-inventory.models';

@Component({
  selector: 'app-organizer-event-inventory',
  imports: [LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Boxes,
        ClipboardCheck,
        RefreshCw,
        Ticket,
        Users,
      }),
    },
  ],
  template: `
    <section class="card detail-table-card" aria-label="Inventário dos setores">
      <div class="card-heading">
        <h2 class="section-title">
          <lucide-icon name="boxes" size="19" aria-hidden="true"></lucide-icon>Inventário
        </h2>
        <button
          class="button secondary inventory-refresh-button"
          type="button"
          aria-label="Atualizar inventário"
          title="Atualizar inventário"
          [disabled]="loading()"
          (click)="loadInventories()"
        >
          <lucide-icon name="refresh-cw" size="16" aria-hidden="true"></lucide-icon>
        </button>
      </div>
      @if (loading()) {
        <p class="muted">Carregando inventários...</p>
      } @else if (!sectors.length) {
        <p class="muted">Associe um setor ao evento para criar seu inventário.</p>
      } @else {
        <div class="table-wrap">
          <table class="event-sector-summary-table">
            <thead>
              <tr>
                <th>
                  <span class="table-heading"
                    ><lucide-icon name="boxes" size="15" aria-hidden="true"></lucide-icon
                    >Setor</span
                  >
                </th>
                <th>
                  <span class="table-heading"
                    ><lucide-icon name="users" size="15" aria-hidden="true"></lucide-icon
                    >Capacidade</span
                  >
                </th>
                <th>
                  <span class="table-heading"
                    ><lucide-icon name="clipboard-check" size="15" aria-hidden="true"></lucide-icon
                    >Reservados</span
                  >
                </th>
                <th>
                  <span class="table-heading"
                    ><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon
                    >Vendidos</span
                  >
                </th>
                <th>
                  <span class="table-heading"
                    ><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon
                    >Disponíveis</span
                  >
                </th>
              </tr>
            </thead>
            <tbody>
              @for (sector of sectors; track sector.id) {
                @let inventory = inventoryFor(sector.id);
                <tr>
                  <td>
                    <strong>{{ sector.name }}</strong>
                  </td>
                  <td>{{ formatQuantity(inventory?.capacity ?? sector.capacity) }}</td>
                  <td>{{ formatQuantity(inventory?.reservedQuantity ?? null) }}</td>
                  <td>{{ formatQuantity(inventory?.soldQuantity ?? null) }}</td>
                  <td>{{ formatQuantity(inventory?.availableQuantity ?? null) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @if (message()) {
        <p class="notice">{{ message() }}</p>
      }
    </section>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventInventory implements OnChanges {
  @Input({ required: true }) eventId = '';
  @Input() sectors: readonly OrganizerSectorManagementItemViewModel[] = [];

  private readonly inventoryApi = inject(OrganizerInventoryApi);
  protected readonly loading = signal(false);
  protected readonly inventories = signal<ReadonlyMap<string, OrganizerSectorInventory | null>>(
    new Map(),
  );
  protected readonly message = signal<string | null>(null);
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
    forkJoin(
      this.sectors.map((sector) =>
        this.inventoryApi.get(this.eventId, sector.id).pipe(
          map((inventory) => [sector.id, inventory] as const),
          catchError(() => of([sector.id, null] as const)),
        ),
      ),
    ).subscribe({
      next: (items) => this.inventories.set(new Map(items)),
      error: () => this.message.set('Não foi possível carregar os inventários no momento.'),
      complete: () => this.loading.set(false),
    });
  }

  protected inventoryFor(sectorId: string): OrganizerSectorInventory | null | undefined {
    return this.inventories().get(sectorId);
  }
  protected formatQuantity(value: number | null): string {
    return value === null ? '—' : this.quantityFormatter.format(value);
  }
}
