import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CalendarDays, CircleDollarSign, Info, Layers, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, Plus, Ticket, Trash2, Users, X } from 'lucide-angular';
import { eventStatusLabel } from '../../../../shared/presentation/presentation-labels';
import { OrganizerEventApi } from '../../data-access/organizer-event.api';
import { OrganizerVenueApi } from '../../data-access/organizer-venue.api';
import { OrganizerEventInventory } from '../../components/organizer-event-inventory/organizer-event-inventory';
import { OrganizerVenue, OrganizerVenueSector } from '../../organizer-venue.models';
import { OrganizerSectorManagementItemViewModel } from '../../organizer.models';
import { OrganizerStore } from '../../state/organizer.store';

@Component({
  selector: 'app-organizer-event-overview',
  imports: [DatePipe, FormsModule, LucideAngularModule, OrganizerEventInventory, RouterLink],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ CalendarDays, CircleDollarSign, Info, Layers, MapPin, Plus, Ticket, Trash2, Users, X }) }],
  template: `
    <section class="management-content event-details-content">
      @if (store.loading()) { <p class="card">Carregando informações do evento...</p> }
      @else if (store.error()) { <p class="notice">{{ store.error() }}</p> }
      @else if (store.event(); as event) {
        <div class="section-heading event-details-heading"><h1>{{ event.name }}</h1></div>
        <section class="card detail-table-card" aria-label="Informações gerais do evento"><div class="table-wrap"><table class="event-summary-table"><thead><tr><th><span class="table-heading"><lucide-icon name="info" size="15" aria-hidden="true"></lucide-icon>Campo</span></th><th>Informação</th></tr></thead><tbody>
          <tr><td><span class="detail-label"><lucide-icon name="info" size="15" aria-hidden="true"></lucide-icon>ID do evento</span></td><td class="event-id-value">{{ event.id }}</td></tr>
          <tr><td><span class="detail-label"><lucide-icon name="info" size="15" aria-hidden="true"></lucide-icon>Status</span></td><td>{{ eventStatusLabel(event.status) }}</td></tr>
          <tr><td><span class="detail-label"><lucide-icon name="calendar-days" size="15" aria-hidden="true"></lucide-icon>Data e horário</span></td><td>{{ event.date | date:'dd/MM/yyyy HH:mm' }}</td></tr>
          <tr><td><span class="detail-label"><lucide-icon name="map-pin" size="15" aria-hidden="true"></lucide-icon>Local</span></td><td>{{ event.venueName ?? 'Indisponível' }}</td></tr>
          <tr><td><span class="detail-label"><lucide-icon name="map-pin" size="15" aria-hidden="true"></lucide-icon>Cidade / UF</span></td><td>{{ event.city ?? 'Indisponível' }}{{ event.state ? ' / ' + event.state : '' }}</td></tr>
          <tr><td><span class="detail-label"><lucide-icon name="layers" size="15" aria-hidden="true"></lucide-icon>Setores cadastrados</span></td><td>{{ store.sectors().length }}</td></tr>
        </tbody></table></div></section>

        <section class="card detail-table-card" aria-label="Setores vinculados ao evento"><div class="card-heading"><h2 class="section-title"><lucide-icon name="layers" size="19" aria-hidden="true"></lucide-icon>Setores vinculados</h2><a class="button primary sector-associate-button" routerLink="./add-sector" aria-label="Associar setor" title="Associar setor"><lucide-icon name="plus" size="17" aria-hidden="true"></lucide-icon></a></div>
          @if (store.sectors().length) { <div class="table-wrap"><table class="event-sector-summary-table"><thead><tr><th><span class="table-heading"><lucide-icon name="layers" size="15" aria-hidden="true"></lucide-icon>Setor</span></th><th><span class="table-heading"><lucide-icon name="circle-dollar-sign" size="15" aria-hidden="true"></lucide-icon>Inteira</span></th><th><span class="table-heading"><lucide-icon name="circle-dollar-sign" size="15" aria-hidden="true"></lucide-icon>Meia</span></th><th><span class="table-heading"><lucide-icon name="users" size="15" aria-hidden="true"></lucide-icon>Capacidade</span></th><th><span class="table-heading"><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon>Disponíveis</span></th><th>Ações</th></tr></thead><tbody>
            @for (sector of store.sectors(); track sector.id) { <tr><td><strong>{{ sector.name }}</strong></td><td>{{ formatPrice(sector.fullPrice) }}</td><td>{{ formatPrice(sector.halfPrice) }}</td><td>{{ formatQuantity(sector.capacity) }}</td><td>{{ formatQuantity(sector.available) }}</td><td class="sector-actions-cell"><button class="sector-remove-button sector-icon-button" type="button" [attr.aria-label]="hasIssuedTickets(sector) ? 'Setor não pode ser removido pois possui ingressos' : 'Remover setor ' + sector.name" [attr.title]="hasIssuedTickets(sector) ? 'Não é possível remover: há ingressos reservados ou vendidos' : 'Remover setor'" [disabled]="removingSectorId() === sector.id || hasIssuedTickets(sector)" (click)="requestRemoval(sector)"><lucide-icon name="trash-2" size="16" aria-hidden="true"></lucide-icon></button></td></tr> }
          </tbody></table></div> } @else { <p class="muted">Nenhum setor retornado para este evento.</p> }
        </section>
        <app-organizer-event-inventory [eventId]="event.id" [sectors]="store.sectors()" />
      } @else { <section class="empty-state"><strong>Evento indisponível</strong><span>Não foi possível carregar os dados básicos deste evento.</span></section> }
      @if (message()) { <p class="notice">{{ message() }}</p> }

      @if (associationFormOpen()) { <div class="sector-confirm-backdrop" role="presentation"><section class="sector-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="associate-sector-title"><div class="card-heading"><h2 id="associate-sector-title">Associar setor</h2><button class="button secondary" type="button" aria-label="Fechar formulário" (click)="closeAssociationForm()"><lucide-icon name="x" size="17" aria-hidden="true"></lucide-icon></button></div>
        @if (loadingVenueSectors()) { <p class="muted">Carregando setores do local...</p> }
        @else if (!availableVenueSectors().length) { <p class="muted">Não há setores disponíveis neste local para associar.</p> }
        @else { <form style="display:grid;gap:14px" (ngSubmit)="associateSector()"><label><span class="detail-label"><lucide-icon name="layers" size="16" aria-hidden="true"></lucide-icon>Setor do local</span><select name="sectorId" [(ngModel)]="newSectorId" (ngModelChange)="selectVenueSector($event)" required><option value="" disabled>Selecione um setor</option>@for (sector of availableVenueSectors(); track sector.id) { <option [value]="sector.id">{{ sector.name }} · {{ formatQuantity(sector.capacity) }} lugares</option> }</select></label><label><span class="detail-label"><lucide-icon name="circle-dollar-sign" size="16" aria-hidden="true"></lucide-icon>Preço inteira</span><input name="basePrice" type="number" min="0.50" step="0.01" [(ngModel)]="newBasePrice" required /></label><label><span class="detail-label"><lucide-icon name="circle-dollar-sign" size="16" aria-hidden="true"></lucide-icon>Preço meia</span><input name="halfPrice" type="number" min="0.50" step="0.01" [(ngModel)]="newHalfPrice" required /></label><div class="actions"><button class="button primary" type="submit" [disabled]="associatingSector() || !newSectorId">{{ associatingSector() ? 'Salvando...' : 'Salvar setor' }}</button></div></form> }
      </section></div> }

      @if (sectorPendingRemoval(); as sector) { <div class="sector-confirm-backdrop" role="presentation"><section class="sector-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-sector-title"><lucide-icon name="trash-2" size="22" aria-hidden="true"></lucide-icon><h2 id="remove-sector-title">Remover setor?</h2><p>Tem certeza que deseja remover o setor <strong>{{ sector.name }}</strong>? Esta ação não pode ser desfeita.</p><div class="sector-confirm-actions"><button class="button secondary" type="button" [disabled]="removingSectorId() !== null" (click)="cancelRemoval()">Cancelar</button><button class="button sector-remove-button" type="button" [disabled]="removingSectorId() !== null" (click)="confirmRemoval()">{{ removingSectorId() ? 'Removendo...' : 'Remover setor' }}</button></div></section></div> }
    </section>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventOverview implements OnInit {
  protected readonly store = inject(OrganizerStore);
  protected readonly eventStatusLabel = eventStatusLabel;
  private readonly eventApi = inject(OrganizerEventApi);
  private readonly venueApi = inject(OrganizerVenueApi);
  private readonly route = inject(ActivatedRoute);
  private readonly eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
  protected readonly associationFormOpen = signal(false);
  protected readonly loadingVenueSectors = signal(false);
  protected readonly associatingSector = signal(false);
  protected readonly removingSectorId = signal<string | null>(null);
  protected readonly sectorPendingRemoval = signal<{ readonly id: string; readonly name: string } | null>(null);
  protected readonly availableVenueSectors = signal<readonly OrganizerVenueSector[]>([]);
  protected readonly message = signal<string | null>(null);
  protected newSectorId = '';
  protected newBasePrice = 0;
  protected newHalfPrice = 0;
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly quantityFormatter = new Intl.NumberFormat('pt-BR');

  ngOnInit(): void { if (this.eventId) { this.store.selectEvent(this.eventId); } }
  protected formatPrice(value: number | null): string { return value === null ? 'Indisponível' : this.currencyFormatter.format(value); }
  protected formatQuantity(value: number | null): string { return value === null ? 'Indisponível' : this.quantityFormatter.format(value); }

  protected openAssociationForm(): void {
    const event = this.store.event();
    this.message.set(null); this.newSectorId = ''; this.newBasePrice = 0; this.newHalfPrice = 0; this.availableVenueSectors.set([]); this.associationFormOpen.set(true);
    if (!event?.venueName) { this.message.set('O local deste evento não está disponível para consulta.'); return; }
    this.loadingVenueSectors.set(true);
    const city = event.city?.trim();
    const state = event.state?.trim();
    if (!city || !state) { this.message.set('A cidade e o estado do local são necessários para consultar os setores disponíveis.'); this.loadingVenueSectors.set(false); return; }
    this.venueApi.listByLocation(city, state).subscribe({
      next: (venues) => {
        const venue = venues.find((item) => this.isEventVenue(item, event.venueName ?? '', event.city, event.state));
        if (!venue?.id) { this.message.set('Não foi possível localizar o local deste evento.'); this.loadingVenueSectors.set(false); return; }
        this.venueApi.get(venue.id).subscribe({ next: (details) => this.setAvailableVenueSectors(details.sectors), error: () => this.message.set('Não foi possível carregar os setores do local.'), complete: () => this.loadingVenueSectors.set(false) });
      },
      error: () => { this.message.set('Não foi possível consultar o local do evento.'); this.loadingVenueSectors.set(false); },
    });
  }

  protected closeAssociationForm(): void { if (!this.associatingSector()) { this.associationFormOpen.set(false); } }
  protected selectVenueSector(sectorId: string): void { const sector = this.availableVenueSectors().find((item) => item.id === sectorId); if (sector?.price !== null && sector?.price !== undefined) { this.newBasePrice = sector.price; this.newHalfPrice = sector.price / 2; } }
  protected associateSector(): void {
    if (!this.eventId || !this.newSectorId) { return; }
    if (this.newBasePrice < 0.5 || this.newHalfPrice < 0.5) { this.message.set('Informe valores de ingresso a partir de R$ 0,50.'); return; }
    this.associatingSector.set(true);
    this.eventApi.addSector(this.eventId, { sectorId: this.newSectorId, basePrice: Number(this.newBasePrice), halfPrice: Number(this.newHalfPrice) }).subscribe({ next: () => { this.message.set('Setor associado com sucesso.'); this.store.selectEvent(this.eventId); }, error: () => { this.message.set('Não foi possível associar o setor no momento.'); this.associatingSector.set(false); }, complete: () => { this.associatingSector.set(false); this.associationFormOpen.set(false); } });
  }
  protected hasIssuedTickets(sector: OrganizerSectorManagementItemViewModel): boolean { return (sector.reservedQuantity ?? 0) > 0 || (sector.soldQuantity ?? 0) > 0; }
  protected requestRemoval(sector: OrganizerSectorManagementItemViewModel): void { if (this.hasIssuedTickets(sector)) { this.message.set('Este setor não pode ser removido porque possui ingressos reservados ou vendidos.'); return; } this.sectorPendingRemoval.set({ id: sector.id, name: sector.name }); }
  protected cancelRemoval(): void { this.sectorPendingRemoval.set(null); }
  protected confirmRemoval(): void {
    const sector = this.sectorPendingRemoval(); if (!this.eventId || !sector) { return; }
    const currentSector = this.store.sectors().find((item) => item.id === sector.id);
    if (currentSector && this.hasIssuedTickets(currentSector)) {
      this.message.set('Este setor não pode ser removido porque possui ingressos reservados ou vendidos.');
      this.sectorPendingRemoval.set(null);
      return;
    }
    this.removingSectorId.set(sector.id);
    this.eventApi.removeSector(this.eventId, sector.id).subscribe({ next: () => { this.message.set('Setor removido com sucesso.'); this.store.selectEvent(this.eventId); }, error: () => { this.message.set('Não foi possível remover o setor no momento.'); this.removingSectorId.set(null); this.sectorPendingRemoval.set(null); }, complete: () => { this.removingSectorId.set(null); this.sectorPendingRemoval.set(null); } });
  }
  private setAvailableVenueSectors(sectors: readonly OrganizerVenueSector[]): void { const eventSectorIds = new Set(this.store.sectors().map((sector) => sector.id)); this.availableVenueSectors.set(sectors.filter((sector) => !eventSectorIds.has(sector.id))); }
  private isEventVenue(venue: OrganizerVenue, name: string, city: string | null | undefined, state: string | null | undefined): boolean { return this.normalize(venue.name) === this.normalize(name) && this.normalize(venue.city) === this.normalize(city) && this.normalize(venue.state) === this.normalize(state); }
  private normalize(value: string | null | undefined): string { return (value ?? '').trim().toLocaleLowerCase(); }
}
