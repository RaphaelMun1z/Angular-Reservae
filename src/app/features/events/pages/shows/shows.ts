import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SiteFooter } from '../../../../layouts/site-footer/site-footer';
import { SiteNavbar } from '../../../../layouts/site-navbar/site-navbar';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EventFilters, EventStore } from '../../state/event.store';
import { AuthStore } from '../../../../core/state/auth.store';

interface ShowsFilterDraft {
  readonly search: string;
  readonly city: string;
  readonly state: string;
  readonly startDate: string;
  readonly endDate: string;
}

@Component({
  selector: 'app-shows',
  imports: [FormsModule, RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './shows.html',
  styleUrl: './shows.scss',
})
export class Shows implements OnInit {
  readonly store = inject(EventStore);
  readonly authStore = inject(AuthStore);
  readonly organizerOnly = computed(() => this.authStore.isOrganizer() && !this.authStore.isAdmin());
  readonly sortOptions = [
    ['eventDate,asc', 'Data mais próxima'],
    ['eventDate,desc', 'Data mais distante'],
    ['title,asc', 'Nome A-Z'],
    ['title,desc', 'Nome Z-A'],
  ] as const;
  readonly brazilianStates = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
    ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
    ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
    ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
    ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
  ] as const;
  readonly draftFilters = signal<ShowsFilterDraft>(this.createDraftFromFilters(this.store.filters()));
  readonly viewMode = signal<'list' | 'grid'>('grid');
  readonly availableCities = computed(() => {
    const state = this.draftFilters().state.trim().toUpperCase();
    if (!state) {
      return [];
    }

    const cities = this.store.events()
      .filter((event) => event.state?.toUpperCase() === state)
      .map((event) => event.city?.trim())
      .filter((city): city is string => Boolean(city));

    return [...new Set(cities)].sort((first, second) => first.localeCompare(second, 'pt-BR'));
  });
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const search = query.get('search') ?? '';
    const city = query.get('city');
    const state = query.get('state');
    const startDate = query.get('startDate');
    const endDate = query.get('endDate');

    if (search || city || state || startDate || endDate) {
      const filters: Partial<EventFilters> = {
        search,
        city,
        state,
        status: 'SCHEDULED',
        startDate,
        endDate,
        size: 12,
        sort: 'eventDate,asc',
      };
      this.store.updateFilters(filters);
      this.draftFilters.set(this.createDraftFromFilters({ ...this.store.filters(), ...filters }));
      return;
    }

    this.store.updateFilters({
      search: '',
      city: null,
      state: null,
      startDate: null,
      endDate: null,
      status: 'SCHEDULED',
      size: 12,
      sort: 'eventDate,asc',
    });
    this.draftFilters.set(this.createDraftFromFilters(this.store.filters()));
  }

  updateDraft<K extends keyof ShowsFilterDraft>(key: K, value: ShowsFilterDraft[K]): void {
    this.draftFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  applyFilters(): void {
    const filters = this.draftFilters();
    this.store.updateFilters({
      search: filters.search,
      city: filters.city || null,
      state: filters.state || null,
      status: 'SCHEDULED',
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      size: 12,
      sort: 'eventDate,asc',
    });
  }

  clearFilters(): void {
    this.store.clearFilters();
    this.draftFilters.set(this.createDraftFromFilters(this.store.filters()));
    this.store.updateFilters({ status: 'SCHEDULED', size: 12, sort: 'eventDate,asc' });
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode.set(mode);
  }

  updateSort(sort: string): void {
    this.store.updateFilters({ sort });
  }

  updateStateDraft(state: string): void {
    this.draftFilters.update((filters) => ({ ...filters, state, city: '' }));
  }

  previousPage(): void {
    this.store.changePage(this.store.currentPage() - 1);
  }

  nextPage(): void {
    this.store.changePage(this.store.currentPage() + 1);
  }

  dateInputValue(value: string | null): string {
    return value ? value.slice(0, 10) : '';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Data em breve';
    }

    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatTime(value: string | null | undefined): string {
    if (!value) {
      return 'Horário a confirmar';
    }

    return new Date(value).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private createDraftFromFilters(filters: EventFilters | Partial<EventFilters>): ShowsFilterDraft {
    return {
      search: filters.search ?? '',
      city: filters.city ?? '',
      state: filters.state ?? '',
      startDate: this.dateInputValue(filters.startDate ?? null),
      endDate: this.dateInputValue(filters.endDate ?? null),
    };
  }

}
