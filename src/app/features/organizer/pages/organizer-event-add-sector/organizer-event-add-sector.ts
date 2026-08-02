import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { AlertTriangle, CalendarDays, CircleDollarSign, Layers, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, Save, Ticket, Users } from 'lucide-angular';
import { OrganizerEventApi } from '../../data-access/organizer-event.api';
import { OrganizerVenueApi } from '../../data-access/organizer-venue.api';
import { OrganizerInventoryApi } from '../../data-access/organizer-inventory.api';
import { apiErrorMessage } from '../../data-access/api-error-message';
import { OrganizerVenue, OrganizerVenueSector } from '../../organizer-venue.models';

@Component({
  selector: 'app-organizer-event-add-sector',
  imports: [FormsModule, RouterLink, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ AlertTriangle, CalendarDays, CircleDollarSign, Layers, MapPin, Save, Ticket, Users }) }],
  template: `
    <main class="organizer-page organizer-form-page">
      <header class="page-header form-page-header"><div><h1>Associar setor ao evento</h1></div><a class="button secondary" [routerLink]="['/organizer/management/events', eventId]">Voltar ao evento</a></header>
      @if (loadingData()) { <section class="state-panel" aria-live="polite"><span class="loading-dot"></span><strong>Carregando setores disponíveis...</strong></section> }
      @else if (!availableSectors().length) { <section class="state-panel"><lucide-icon name="layers" size="22" aria-hidden="true"></lucide-icon><strong>Nenhum setor disponível para associar</strong><span>Todos os setores deste local já estão associados ao evento.</span><a class="button secondary" [routerLink]="['/organizer/management/events', eventId]">Voltar ao evento</a></section> }
      @else {
        <form class="card event-form-card" (ngSubmit)="submit()">
          <section class="form-section" aria-labelledby="associate-sector-title">
            <div class="form-section-heading"><span class="form-section-icon"><lucide-icon name="layers" size="18" aria-hidden="true"></lucide-icon></span><div><h2 id="associate-sector-title">Setor e valores</h2></div></div>
            <div class="field-grid">
              <label class="full"><span class="form-label"><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon>Setor do local</span><select name="sectorId" [(ngModel)]="sectorId" (ngModelChange)="selectSector($event)" required><option value="" disabled>Selecione um setor</option>@for (sector of availableSectors(); track sector.id) { <option [value]="sector.id">{{ sector.name }} · {{ formatCapacity(sector.capacity) }} lugares</option> }</select></label>
              @if (selectedSector(); as sector) { <div class="sector-info full"><span><lucide-icon name="layers" size="15" aria-hidden="true"></lucide-icon><strong>{{ sector.name }}</strong></span><span><lucide-icon name="users" size="15" aria-hidden="true"></lucide-icon>Capacidade máxima: {{ formatCapacity(sector.capacity) }}</span></div> }
              <label class="pricing-field" [class.has-error]="quantityError()"><span class="form-label"><lucide-icon name="users" size="15" aria-hidden="true"></lucide-icon>Quantidade de ingressos</span><input name="capacity" type="number" min="0" [max]="selectedSector()?.capacity || null" step="1" [(ngModel)]="capacity" (ngModelChange)="message.set(null)" [attr.aria-invalid]="quantityError() ? 'true' : 'false'" required />@if (quantityError(); as error) { <span class="field-error" role="alert">{{ error }}</span> }</label>
              <div class="pricing-pair full">
                <label class="pricing-field" [class.has-error]="priceError(basePrice)"><span class="form-label"><lucide-icon name="circle-dollar-sign" size="15" aria-hidden="true"></lucide-icon>Preço inteira</span><input name="basePrice" inputmode="decimal" [value]="formatCurrency(basePrice)" (input)="onPriceInput($event, 'basePrice')" placeholder="R$ 0,50" required />@if (priceError(basePrice); as error) { <span class="field-error" role="alert">{{ error }}</span> }</label>
                <label class="pricing-field" [class.has-error]="priceError(halfPrice)"><span class="form-label"><lucide-icon name="circle-dollar-sign" size="15" aria-hidden="true"></lucide-icon>Preço meia</span><input name="halfPrice" inputmode="decimal" [value]="formatCurrency(halfPrice)" (input)="onPriceInput($event, 'halfPrice')" placeholder="R$ 0,50" required />@if (priceError(halfPrice); as error) { <span class="field-error" role="alert">{{ error }}</span> }</label>
              </div>
            </div>
          </section>
          <div class="form-footer"><a class="button secondary" [routerLink]="['/organizer/management/events', eventId]">Cancelar</a><button class="button primary" type="submit" [disabled]="saving() || !sectorId || quantityError()"><lucide-icon name="save" size="16" aria-hidden="true"></lucide-icon>{{ saving() ? 'Salvando...' : 'Associar setor' }}</button></div>
        </form>
      }
      @if (message()) { <p class="notice" [class.success]="saved()" role="status">{{ message() }}</p> }
      @if (freePriceConfirmationOpen()) { <div class="sector-confirm-backdrop" role="presentation"><section class="sector-confirm-dialog free-price-dialog" role="dialog" aria-modal="true" aria-labelledby="price-confirmation-title"><lucide-icon name="alert-triangle" size="24" aria-hidden="true"></lucide-icon><h2 id="price-confirmation-title">Confirmar valor dos ingressos?</h2><p>Um ou mais ingressos serão vendidos pelo valor mínimo de <strong>R$ 0,50</strong>. Deseja manter esse valor mesmo?</p><div class="sector-confirm-actions"><button class="button secondary" type="button" (click)="cancelFreePriceConfirmation()">Voltar e revisar</button><button class="button primary" type="button" [disabled]="saving()" (click)="confirmFreePrices()">Sim, manter esse valor</button></div></section></div> }
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventAddSector implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventApi = inject(OrganizerEventApi);
  private readonly venueApi = inject(OrganizerVenueApi);
  private readonly inventoryApi = inject(OrganizerInventoryApi);
  protected readonly eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
  protected readonly loadingData = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly freePriceConfirmationOpen = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly availableSectors = signal<readonly OrganizerVenueSector[]>([]);
  protected readonly selectedSector = signal<OrganizerVenueSector | null>(null);
  protected readonly venueName = signal('Local do evento');
  protected sectorId = '';
  protected basePrice = 0;
  protected halfPrice = 0;
  protected capacity = 0;
  private readonly quantityFormatter = new Intl.NumberFormat('pt-BR');

  ngOnInit(): void {
    if (!this.eventId) { this.loadingData.set(false); this.message.set('Evento não identificado.'); return; }
    this.eventApi.get(this.eventId).pipe(catchError(() => { this.message.set('Não foi possível carregar o evento.'); return of(null); }), finalize(() => this.loadingData.set(false))).subscribe((event) => {
      if (!event?.venueName || !event.city || !event.state) { this.message.set('Os dados do local deste evento não estão disponíveis.'); return; }
      this.venueName.set(event.venueName);
      this.venueApi.listByLocation(event.city, event.state).subscribe({
        next: (venues) => {
          const venue = venues.find((item) => this.same(item, event.venueName ?? '', event.city!, event.state!));
          if (!venue) { this.message.set('Não foi possível localizar o local do evento.'); return; }
          this.venueApi.get(venue.id).subscribe({
            next: (details) => {
              this.venueName.set(details.name);
              this.eventApi.sectors(this.eventId).subscribe({
                next: (sectors) => { const linked = new Set(sectors.map((sector) => sector.id)); this.availableSectors.set(details.sectors.filter((sector) => !linked.has(sector.id))); },
                error: () => this.message.set('Não foi possível carregar os setores já associados.'),
              });
            },
            error: () => this.message.set('Não foi possível carregar os setores do local.'),
          });
        },
        error: () => this.message.set('Não foi possível consultar os locais disponíveis.'),
      });
    });
  }

  protected selectSector(id: string): void { const sector = this.availableSectors().find((item) => item.id === id) ?? null; this.selectedSector.set(sector); this.capacity = sector?.capacity ?? 1; if (sector?.price !== null && sector?.price !== undefined) { this.basePrice = sector.price; this.halfPrice = sector.price / 2; } }
  protected formatCapacity(value: number | null): string { return value === null ? 'Indisponível' : this.quantityFormatter.format(value); }
  protected formatCurrency(value: number): string { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  protected onPriceInput(event: Event, field: 'basePrice' | 'halfPrice'): void { const input = event.target as HTMLInputElement; const digits = input.value.replace(/\D/g, ''); this[field] = digits ? Number(digits) / 100 : 0; input.value = digits ? this.formatCurrency(this[field]) : ''; }
  protected hasFreePrices(): boolean { return this.basePrice === 0.5 || this.halfPrice === 0.5; }
  protected priceError(value: number): string | null { return value < 0.5 ? 'O valor mínimo é R$ 0,50' : null; }
  protected quantityError(): string | null { const max = this.selectedSector()?.capacity ?? null; if (this.capacity <= 0) return 'A quantidade deve ser maior que zero'; if (max !== null && this.capacity > max) return 'O limite deste setor é de ' + this.formatCapacity(max) + ' ingressos'; return null; }
  protected confirmFreePrices(): void { this.freePriceConfirmationOpen.set(false); this.submit(true); }
  protected cancelFreePriceConfirmation(): void { this.freePriceConfirmationOpen.set(false); }
  protected submit(allowFreePrices = false): void {
    if (!this.eventId || !this.sectorId || this.priceError(this.basePrice) || this.priceError(this.halfPrice) || this.quantityError()) { this.message.set(this.quantityError() ?? this.priceError(this.basePrice) ?? this.priceError(this.halfPrice) ?? 'Selecione um setor e informe valores válidos.'); return; }
    if (!allowFreePrices && this.hasFreePrices()) { this.freePriceConfirmationOpen.set(true); return; }
    this.saving.set(true); this.saved.set(false); this.message.set(null);
    this.eventApi.addSector(this.eventId, { sectorId: this.sectorId, basePrice: Number(this.basePrice), halfPrice: Number(this.halfPrice) }).pipe(switchMap(() => this.inventoryApi.create({ eventId: this.eventId, sectorId: this.sectorId, capacity: Number(this.capacity) })), finalize(() => this.saving.set(false))).subscribe({ next: () => { this.saved.set(true); this.message.set('Setor e inventário associados com sucesso. Redirecionando...'); window.setTimeout(() => void this.router.navigate(['/organizer/management/events', this.eventId]), 800); }, error: (error: unknown) => this.message.set(apiErrorMessage(error, 'Não foi possível associar o setor e criar o inventário no momento.')) });
  }
  private same(venue: OrganizerVenue, name: string, city: string, state: string): boolean { return this.normalize(venue.name) === this.normalize(name) && this.normalize(venue.city) === this.normalize(city) && this.normalize(venue.state) === this.normalize(state); }
  private normalize(value: string | null | undefined): string { return (value ?? '').trim().toLocaleLowerCase(); }
}
