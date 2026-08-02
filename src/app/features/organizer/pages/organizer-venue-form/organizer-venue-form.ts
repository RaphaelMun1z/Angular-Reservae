import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { Layers, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, Plus, Users } from 'lucide-angular';
import { IbgeCity, IbgeLocationApi, IbgeState } from '../../data-access/ibge-location.api';
import { CreateOrganizerVenueRequest, OrganizerVenueApi } from '../../data-access/organizer-venue.api';
import { apiErrorMessage } from '../../data-access/api-error-message';

@Component({
  selector: 'app-organizer-venue-form',
  imports: [FormsModule, RouterLink, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Layers, MapPin, Plus, Users }) }],
  template: `
    <main class="organizer-page">
      <header class="page-header"><div><h1>Registrar local de evento</h1></div><div class="actions"><button class="button info" type="button" (click)="applyMockData()"><lucide-icon name="layers" size="16" aria-hidden="true"></lucide-icon>Aplicar dados de teste</button><a class="button secondary" routerLink="/organizer/management/venues">Voltar</a></div></header>
      <form class="card field-grid" (ngSubmit)="submit()">
        <label class="full">Nome do local<input name="name" [(ngModel)]="form.name" required /></label>
        <label><span class="form-label"><lucide-icon name="map-pin" size="15" aria-hidden="true"></lucide-icon>Estado</span><select name="state" [(ngModel)]="form.state" (ngModelChange)="selectState($event)" required><option value="" disabled>Selecione um estado</option>@for (state of states(); track state.uf) { <option [value]="state.uf">{{ state.name }} ({{ state.uf }})</option> }</select></label>
        <label><span class="form-label"><lucide-icon name="map-pin" size="15" aria-hidden="true"></lucide-icon>Cidade</span><select name="city" [(ngModel)]="form.city" [disabled]="!form.state || loadingCities()" required><option value="" disabled>{{ loadingCities() ? 'Carregando cidades...' : form.state ? 'Selecione uma cidade' : 'Selecione o estado primeiro' }}</option>@for (city of cities(); track city.id) { <option [value]="city.name">{{ city.name }}</option> }</select></label>
        <label>Capacidade total<input name="totalCapacity" type="number" min="1" [(ngModel)]="form.totalCapacity" required /></label>
        <section class="full venue-form-sectors"><div class="card-heading"><h2 class="venue-section-title"><lucide-icon name="layers" size="18" aria-hidden="true"></lucide-icon><span>Setores</span></h2><button class="button secondary" type="button" (click)="addSector()"><lucide-icon name="plus" size="16" aria-hidden="true"></lucide-icon>Adicionar setor</button></div>
          @for (sector of form.sectors; track $index) { <div class="venue-sector-form"><label>Nome<input [name]="'sectorName' + $index" [(ngModel)]="sector.name" required /></label><label>Capacidade<input [name]="'sectorCapacity' + $index" type="number" min="1" [(ngModel)]="sector.capacity" required /></label>@if (form.sectors.length > 1) { <button class="button secondary" type="button" (click)="removeSector($index)">Remover</button> }</div> }
        </section>
        <div class="actions full"><button class="button primary" type="submit" [disabled]="saving()">{{ saving() ? 'Salvando...' : 'Registrar local' }}</button></div>
      </form>
      @if (message()) { <p class="notice" [class.success]="saved()" role="alert" aria-live="polite">{{ message() }}</p> }
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerVenueForm {
  private readonly api = inject(OrganizerVenueApi);
  private readonly locationApi = inject(IbgeLocationApi);
  private readonly router = inject(Router);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly states = signal<readonly IbgeState[]>([]);
  protected readonly cities = signal<readonly IbgeCity[]>([]);
  protected readonly loadingCities = signal(false);
  protected form: VenueForm = this.emptyForm();

  constructor() {
    this.locationApi.listStates().pipe(
      catchError(() => { this.message.set('Não foi possível carregar os estados.'); return of([] as readonly IbgeState[]); }),
    ).subscribe((states) => this.states.set(states));
  }

  protected addSector(): void { this.form.sectors = [...this.form.sectors, { name: '', capacity: 1 }]; }
  protected removeSector(index: number): void { this.form.sectors = this.form.sectors.filter((_, itemIndex) => itemIndex !== index); }

  protected selectState(uf: string): void {
    this.form.city = '';
    this.cities.set([]);
    if (!uf) return;
    this.loadingCities.set(true);
    this.locationApi.listCities(uf).pipe(
      catchError(() => { this.message.set('Não foi possível carregar as cidades deste estado.'); return of([] as readonly IbgeCity[]); }),
      finalize(() => this.loadingCities.set(false)),
    ).subscribe((cities) => this.cities.set(cities));
  }

  protected applyMockData(): void {
    const mockState: IbgeState = { uf: 'MG', name: 'Minas Gerais' };
    const mockCity: IbgeCity = { id: 3170206, name: 'Uberlândia' };
    const mockSectors = [
      { name: 'Arquibancada Geral', capacity: 11500 },
      { name: 'Arquibancada Comum', capacity: 9500 },
      { name: 'Arquibancada Especial', capacity: 6500 },
      { name: 'Cadeiras Numeradas', capacity: 4200 },
      { name: 'Cadeiras Cativas', capacity: 1800 },
      { name: 'Área do Gramado', capacity: 13000 },
      { name: 'Área reservada para PCD', capacity: 282 },
    ];

    this.form = { name: 'Estádio Municipal Parque do Sabiá', city: mockCity.name, state: mockState.uf, totalCapacity: 46782, sectors: mockSectors };
    this.states.update((states) => states.some((state) => state.uf === mockState.uf) ? states : [...states, mockState]);
    this.cities.set([mockCity]);
    this.loadingCities.set(false);
  }

  protected submit(): void {
    if (!this.form.name.trim() || !this.form.city.trim() || !this.form.state.trim() || this.form.totalCapacity < 1) return;
    this.saving.set(true);
    this.saved.set(false);
    this.message.set(null);
    const request: CreateOrganizerVenueRequest = { ...this.form, name: this.form.name.trim(), city: this.form.city.trim(), state: this.form.state.trim().toUpperCase() };
    this.api.create(request).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.saved.set(true);
        this.message.set('Local registrado com sucesso. Redirecionando...');
        window.setTimeout(() => void this.router.navigateByUrl('/organizer/management/venues'), 900);
      },
      error: (error: unknown) => this.message.set(apiErrorMessage(error, 'Não foi possível registrar o local no momento.')),
    });
  }

  private emptyForm(): VenueForm { return { name: '', city: '', state: '', totalCapacity: 1, sectors: [{ name: '', capacity: 1 }] }; }
}

interface VenueForm {
  name: string;
  city: string;
  state: string;
  totalCapacity: number;
  sectors: Array<{ name: string; capacity: number }>;
}
