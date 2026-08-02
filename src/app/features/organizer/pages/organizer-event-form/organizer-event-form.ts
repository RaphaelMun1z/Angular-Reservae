import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AlertTriangle, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Layers, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, Save, Ticket, Users } from 'lucide-angular';
import { OrganizerEventApi } from '../../data-access/organizer-event.api';
import { OrganizerVenueApi } from '../../data-access/organizer-venue.api';
import { OrganizerInventoryApi } from '../../data-access/organizer-inventory.api';
import { apiErrorMessage } from '../../data-access/api-error-message';
import { OrganizerVenue } from '../../organizer-venue.models';

@Component({
  selector: 'app-organizer-event-form',
  imports: [FormsModule, RouterLink, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ AlertTriangle, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Layers, MapPin, Save, Ticket, Users }) }],
  template: `
    <main class="organizer-page organizer-form-page">
      <header class="page-header form-page-header">
        <div><h1>Criar evento</h1></div>
        <div class="actions"><button class="button info" type="button" (click)="applyMockData()"><lucide-icon name="layers" size="16" aria-hidden="true"></lucide-icon>Aplicar dados de teste</button><a class="button secondary" routerLink="/organizer/management/events">Voltar aos eventos</a></div>
      </header>

      @if (loadingVenues()) {
        <section class="state-panel" aria-live="polite"><span class="loading-dot"></span><strong>Carregando locais disponíveis...</strong><p>Estamos preparando as opções para o seu evento.</p></section>
      } @else if (editing) {
        <section class="state-panel"><strong>Edição de eventos indisponível</strong><p>A criação está disponível, mas a edição ainda depende da integração de atualização no catálogo.</p><a class="button secondary" routerLink="/organizer/management/events">Voltar para eventos</a></section>
      } @else {
        <div class="event-form-layout">
          <form class="card event-form-card" (ngSubmit)="submit()">
            <section class="form-section" aria-labelledby="event-basic-title">
              <div class="form-section-heading"><span class="form-section-icon"><lucide-icon name="calendar-days" size="18" aria-hidden="true"></lucide-icon></span><div><h2 id="event-basic-title">Informações básicas</h2></div></div>
              <div class="field-grid">
                <label class="full"><span class="form-label">Título do evento</span><input name="title" [(ngModel)]="form.title" placeholder="Ex.: Baile de Pré-Réveillon 2026" required /></label>
                <label><span class="form-label"><lucide-icon name="calendar-days" size="15" aria-hidden="true"></lucide-icon>Data</span><input name="eventDate" type="date" [(ngModel)]="form.eventDate" required /></label>
                <label><span class="form-label"><lucide-icon name="clock-3" size="15" aria-hidden="true"></lucide-icon>Horário</span><input name="eventTime" type="time" [(ngModel)]="form.eventTime" required /></label>
              </div>
            </section>

            <section class="form-section" aria-labelledby="event-location-title">
              <div class="form-section-heading"><span class="form-section-icon"><lucide-icon name="map-pin" size="18" aria-hidden="true"></lucide-icon></span><div><h2 id="event-location-title">Local do evento</h2></div></div>
              <label><span class="form-label"><lucide-icon name="map-pin" size="15" aria-hidden="true"></lucide-icon>Local cadastrado</span><select name="venueId" [(ngModel)]="form.venueId" (ngModelChange)="selectVenue($event)" required><option value="" disabled>Selecione um local</option>@for (venue of venues(); track venue.id) { <option [value]="venue.id">{{ venue.name }} · {{ venue.city }}{{ venue.state ? ' / ' + venue.state : '' }}</option> }</select></label>
              @if (!venues().length) { <p class="inline-warning">Nenhum local cadastrado. <a routerLink="/organizer/management/venues/create">Registrar local</a></p> }
              @if (selectedVenue() && !selectedVenue()!.sectors.length) { <p class="inline-warning">Este local ainda não possui setores cadastrados.</p> }
            </section>

            <section class="form-section" aria-labelledby="event-pricing-title">
              <div class="form-section-heading"><span class="form-section-icon"><lucide-icon name="ticket" size="18" aria-hidden="true"></lucide-icon></span><div><h2 id="event-pricing-title">Preços dos setores</h2></div></div>
              @if (form.sectorsPricing.length) { <div class="pricing-config-stack"><div class="sector-picker" aria-label="Setores disponíveis"><div class="sector-picker-heading"><span class="form-label"><lucide-icon name="layers" size="15" aria-hidden="true"></lucide-icon>Setores do local</span><strong>{{ selectedSectorCount() }}/{{ form.sectorsPricing.length }}</strong></div><div class="sector-picker-list">@for (pricing of form.sectorsPricing; track pricing.sectorId) { <label class="sector-picker-item" [class.is-selected]="pricing.selected"><input [name]="'sectorSelected' + pricing.sectorId" type="checkbox" [(ngModel)]="pricing.selected" /><span><strong>{{ sectorName(pricing.sectorId) }}</strong><small>{{ pricing.selected ? 'Selecionado' : 'Não incluído' }} · Máx. {{ formatCapacity(pricing.maxCapacity) }}</small></span><lucide-icon name="ticket" size="15" aria-hidden="true"></lucide-icon></label> }</div></div><div class="pricing-list">@for (pricing of selectedPricing(); track pricing.sectorId) { <div class="pricing-row"><div class="pricing-sector"><span class="pricing-sector-icon"><lucide-icon name="layers" size="16" aria-hidden="true"></lucide-icon></span><span class="pricing-sector-copy"><strong>{{ sectorName(pricing.sectorId) }}</strong><small>Capacidade máxima: {{ formatCapacity(pricing.maxCapacity) }}</small></span></div><label class="pricing-field" [class.has-error]="capacityError(pricing)"><span class="form-label"><lucide-icon name="users" size="14" aria-hidden="true"></lucide-icon>Quantidade</span><input [name]="'capacity' + pricing.sectorId" [id]="'capacity-' + pricing.sectorId" type="number" min="0" [max]="pricing.maxCapacity || null" step="1" [(ngModel)]="pricing.capacity" (ngModelChange)="onCapacityChange()" [attr.aria-invalid]="capacityError(pricing) ? 'true' : 'false'" [attr.aria-describedby]="'capacity-error-' + pricing.sectorId" required />@if (capacityError(pricing); as error) { <span class="field-error" [id]="'capacity-error-' + pricing.sectorId" role="alert">{{ error }}</span> }</label><label class="pricing-field"><span class="form-label"><lucide-icon name="circle-dollar-sign" size="14" aria-hidden="true"></lucide-icon>Inteira</span><input [name]="'basePrice' + pricing.sectorId" inputmode="decimal" [value]="formatCurrency(pricing.basePrice)" (input)="onPriceInput($event, pricing, 'basePrice')" placeholder="R$ 0,00" required /></label><label class="pricing-field"><span class="form-label"><lucide-icon name="circle-dollar-sign" size="14" aria-hidden="true"></lucide-icon>Meia</span><input [name]="'halfPrice' + pricing.sectorId" inputmode="decimal" [value]="formatCurrency(pricing.halfPrice)" (input)="onPriceInput($event, pricing, 'halfPrice')" placeholder="R$ 0,00" required /></label></div> } @if (!selectedSectorCount()) { <div class="section-empty"><lucide-icon name="layers" size="20" aria-hidden="true"></lucide-icon><strong>Selecione ao menos um setor</strong><span>Os setores selecionados aparecerão aqui para configuração.</span></div> }</div></div> } @else { <div class="section-empty"><lucide-icon name="layers" size="20" aria-hidden="true"></lucide-icon><strong>Selecione um local para carregar os setores</strong><span>Os preços serão preenchidos com base no cadastro do local.</span></div> }
            </section>

            <div class="form-footer"><a class="button secondary" routerLink="/organizer/management/events">Cancelar</a><button class="button primary" type="submit" [disabled]="creating() || !canSubmit()"><lucide-icon name="save" size="16" aria-hidden="true"></lucide-icon>{{ creating() ? 'Salvando...' : 'Criar evento' }}</button></div>
          </form>

          <aside class="form-summary-card" aria-label="Resumo do evento">
            <div class="summary-card-heading"><span class="form-section-icon"><lucide-icon name="calendar-days" size="18" aria-hidden="true"></lucide-icon></span><div><span class="eyebrow">Resumo</span><h2>Seu evento</h2></div></div>
            <div class="summary-preview"><strong>{{ form.title || 'Título do evento' }}</strong><span><lucide-icon name="calendar-days" size="14" aria-hidden="true"></lucide-icon>{{ dateLabel() }}</span><span><lucide-icon name="map-pin" size="14" aria-hidden="true"></lucide-icon>{{ selectedVenue()?.name || 'Local não selecionado' }}</span></div>
            <div class="summary-stat"><span><lucide-icon name="layers" size="15" aria-hidden="true"></lucide-icon>Setores configurados</span><strong>{{ selectedSectorCount() }}</strong></div>
            <div class="summary-hint"><lucide-icon name="users" size="16" aria-hidden="true"></lucide-icon><span>Confirme capacidade e preços antes de publicar o evento no catálogo.</span></div>
          </aside>
        </div>
      }
      @if (message()) { <p class="notice" role="alert">{{ message() }}</p> }
      @if (successMessage()) { <p class="notice success" role="status" aria-live="polite"><lucide-icon name="check-circle-2" size="17" aria-hidden="true"></lucide-icon>{{ successMessage() }}</p> }
      @if (freePriceConfirmationOpen()) { <div class="sector-confirm-backdrop" role="presentation"><section class="sector-confirm-dialog free-price-dialog" role="dialog" aria-modal="true" aria-labelledby="price-confirmation-title"><lucide-icon name="alert-triangle" size="24" aria-hidden="true"></lucide-icon><h2 id="price-confirmation-title">Confirmar valor dos ingressos?</h2><p>Um ou mais ingressos serão vendidos pelo valor mínimo de <strong>R$ 0,50</strong>. Deseja manter esse valor mesmo?</p><div class="sector-confirm-actions"><button class="button secondary" type="button" (click)="cancelFreePriceConfirmation()">Voltar e revisar</button><button class="button primary" type="button" [disabled]="creating()" (click)="confirmFreePrices()">Sim, manter esse valor</button></div></section></div> }
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEventForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventApi = inject(OrganizerEventApi);
  private readonly venueApi = inject(OrganizerVenueApi);
  private readonly inventoryApi = inject(OrganizerInventoryApi);
  protected readonly editing = this.route.snapshot.paramMap.has('eventId') || this.route.parent?.snapshot.paramMap.has('eventId') === true;
  protected readonly venues = signal<readonly OrganizerVenue[]>([]);
  protected readonly selectedVenue = signal<OrganizerVenue | null>(null);
  protected readonly loadingVenues = signal(false);
  protected readonly creating = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly freePriceConfirmationOpen = signal(false);
  protected form: EventForm = { title: '', eventDate: '', eventTime: '', venueId: '', sectorsPricing: [] };

  ngOnInit(): void {
    if (this.editing) return;
    this.loadingVenues.set(true);
    this.venueApi.list().pipe(catchError(() => { this.message.set('Não foi possível carregar os locais. Tente novamente.'); return of([] as readonly OrganizerVenue[]); }), finalize(() => this.loadingVenues.set(false))).subscribe((venues) => this.venues.set(venues));
  }

  protected selectVenue(venueId: string): void {
    const venue = this.venues().find((item) => item.id === venueId) ?? null;
    this.selectedVenue.set(venue);
    this.form.sectorsPricing = venue?.sectors.map((sector) => ({ sectorId: sector.id, basePrice: sector.price ?? 0, halfPrice: (sector.price ?? 0) / 2, capacity: Math.max(1, sector.capacity ?? 1), maxCapacity: sector.capacity, selected: true })) ?? [];
  }

  protected applyMockData(): void {
    const mockVenue: OrganizerVenue = {
      id: 'mock-parque-do-sabia',
      name: 'Estádio Municipal Parque do Sabiá',
      city: 'Uberlândia',
      state: 'MG',
      totalCapacity: 46782,
      sectors: [
        { id: 'mock-arquibancada-geral', name: 'Arquibancada Geral', capacity: 11500, price: 80 },
        { id: 'mock-arquibancada-comum', name: 'Arquibancada Comum', capacity: 9500, price: 60 },
        { id: 'mock-arquibancada-especial', name: 'Arquibancada Especial', capacity: 6500, price: 100 },
        { id: 'mock-cadeiras-numeradas', name: 'Cadeiras Numeradas', capacity: 4200, price: 150 },
        { id: 'mock-cadeiras-cativas', name: 'Cadeiras Cativas', capacity: 1800, price: 220 },
        { id: 'mock-area-gramado', name: 'Área do Gramado', capacity: 13000, price: 180 },
        { id: 'mock-area-pcd', name: 'Área reservada para PCD', capacity: 282, price: 40 },
      ],
    };
    const existingVenue = this.venues().find((venue) => this.normalize(venue.name) === this.normalize(mockVenue.name));
    const venue: OrganizerVenue = existingVenue ? {
      ...existingVenue,
      sectors: existingVenue.sectors.map((sector) => {
        const mockSector = mockVenue.sectors.find((item) => this.normalize(item.name) === this.normalize(sector.name));
        return mockSector ? { ...sector, capacity: sector.capacity ?? mockSector.capacity, price: mockSector.price } : sector;
      }),
    } : mockVenue;
    this.venues.set(existingVenue ? this.venues().map((item) => item.id === venue.id ? venue : item) : [...this.venues(), venue]);
    this.form.title = 'Festival Parque do Sabiá 2026';
    this.form.eventDate = '2026-12-30';
    this.form.eventTime = '20:00';
    this.form.venueId = venue.id;
    this.selectVenue(venue.id);
  }

  protected sectorName(sectorId: string): string { return this.selectedVenue()?.sectors.find((sector) => sector.id === sectorId)?.name ?? 'Setor'; }
  protected selectedPricing(): PricingForm[] { return this.form.sectorsPricing.filter((pricing) => pricing.selected); }
  protected selectedSectorCount(): number { return this.form.sectorsPricing.filter((pricing) => pricing.selected).length; }
  protected canSubmit(): boolean { return Boolean(this.form.title.trim() && this.form.eventDate && this.form.eventTime && this.form.venueId && this.selectedSectorCount() > 0 && this.selectedPricing().every((pricing) => pricing.capacity >= 1 && (!pricing.maxCapacity || pricing.capacity <= pricing.maxCapacity) && !this.priceError(pricing, 'basePrice') && !this.priceError(pricing, 'halfPrice'))); }
  protected capacityError(pricing: PricingForm): string | null { if (!pricing.capacity || pricing.capacity <= 0) return 'A quantidade deve ser maior que zero'; if (pricing.maxCapacity && pricing.capacity > pricing.maxCapacity) return `O limite deste setor é de ${this.formatQuantity(pricing.maxCapacity)} ingressos`; return null; }
  protected priceError(pricing: PricingForm, field: 'basePrice' | 'halfPrice'): string | null { return pricing[field] < 0.5 ? 'O valor mínimo é R$ 0,50' : null; }
  protected onCapacityChange(): void { if (!this.selectedPricing().some((pricing) => this.capacityError(pricing))) this.message.set(null); }
  protected dateLabel(): string { if (!this.form.eventDate) return 'Data não definida'; const date = new Date(`${this.form.eventDate}T${this.form.eventTime || '00:00'}`); return Number.isNaN(date.getTime()) ? 'Data não definida' : date.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }); }
  protected formatCurrency(value: number): string { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  protected formatQuantity(value: number): string { return Number(value || 0).toLocaleString('pt-BR'); }
  private normalize(value: string | null | undefined): string { return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
  protected formatCapacity(value: number | null): string { return value && value > 0 ? this.formatQuantity(value) : 'não informada'; }
  protected onPriceInput(event: Event, pricing: PricingForm, field: 'basePrice' | 'halfPrice'): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    pricing[field] = digits ? Number(digits) / 100 : 0;
    input.value = digits ? this.formatCurrency(pricing[field]) : '';
  }

  protected hasFreePrices(): boolean { return this.selectedPricing().some((pricing) => pricing.basePrice === 0.5 || pricing.halfPrice === 0.5); }
  protected confirmFreePrices(): void { this.freePriceConfirmationOpen.set(false); this.submit(true); }
  protected cancelFreePriceConfirmation(): void { this.freePriceConfirmationOpen.set(false); }

  protected submit(allowFreePrices = false): void {
    if (!this.canSubmit()) {
      if (this.selectedPricing().some((pricing) => this.capacityError(pricing))) this.message.set('Revise a quantidade de ingressos dos setores destacados antes de criar o evento.');
      else if (this.selectedPricing().some((pricing) => this.priceError(pricing, 'basePrice') || this.priceError(pricing, 'halfPrice'))) this.message.set('Informe valores de ingresso a partir de R$ 0,50.');
      return;
    }
    if (!allowFreePrices && this.hasFreePrices()) {
      this.freePriceConfirmationOpen.set(true);
      return;
    }
    this.creating.set(true); this.message.set(null); this.successMessage.set(null);
    const selectedPricing = this.selectedPricing();
    const sectorsPricing = selectedPricing.map(({ sectorId, basePrice, halfPrice }) => ({ sectorId, basePrice, halfPrice }));
    this.eventApi.create({ title: this.form.title.trim(), eventDate: new Date(`${this.form.eventDate}T${this.form.eventTime}`).toISOString(), venueId: this.form.venueId, sectorsPricing }).pipe(switchMap((event) => forkJoin(selectedPricing.map((pricing) => this.inventoryApi.create({ eventId: event.id, sectorId: pricing.sectorId, capacity: pricing.capacity }))).pipe(map(() => event))), finalize(() => this.creating.set(false))).subscribe({ next: (event) => { this.successMessage.set('Evento e inventário criados com sucesso. Redirecionando para o gerenciamento...'); window.setTimeout(() => void this.router.navigate(['/organizer/management/events', event.id]), 900); }, error: (error: unknown) => this.message.set(apiErrorMessage(error, 'O evento foi criado, mas não foi possível criar todos os inventários. Verifique o gerenciamento do evento.')) });
  }
}

type PricingForm = { sectorId: string; basePrice: number; halfPrice: number; capacity: number; maxCapacity: number | null; selected: boolean };
interface EventForm { title: string; eventDate: string; eventTime: string; venueId: string; sectorsPricing: PricingForm[]; }
