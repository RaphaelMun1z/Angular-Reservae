import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { EventStatus } from '../../core/models/event-catalog.model';
import { EventFilters, EventStore } from '../events/state/event.store';
import { eventStatusLabel } from '../../shared/presentation-labels';

interface ShowsFilterDraft {
  readonly search: string;
  readonly city: string;
  readonly state: string;
  readonly status: EventStatus | '';
  readonly startDate: string;
  readonly endDate: string;
  readonly size: number;
  readonly sort: string;
}

@Component({
  selector: 'app-shows',
  imports: [FormsModule, RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './shows.html',
  styleUrl: './shows.scss',
})
export class Shows implements OnInit {
  readonly store = inject(EventStore);
  readonly statuses: readonly EventStatus[] = ['SCHEDULED', 'CANCELED', 'FINISHED'];
  readonly quickCities: readonly string[] = ['Sao Paulo', 'Rio de Janeiro', 'Curitiba'];
  readonly pageSizes: readonly number[] = [6, 12, 24];
  readonly sortOptions: readonly { value: string; label: string }[] = [
    { value: 'eventDate,asc', label: 'Data mais proxima' },
    { value: 'eventDate,desc', label: 'Data mais distante' },
    { value: 'title,asc', label: 'Nome A-Z' },
    { value: 'title,desc', label: 'Nome Z-A' },
  ];
  readonly draftFilters = signal<ShowsFilterDraft>(this.createDraftFromFilters(this.store.filters()));
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const search = query.get('search') ?? '';
    const city = query.get('city');
    const state = query.get('state');
    const status = query.get('status');
    const startDate = query.get('startDate');
    const endDate = query.get('endDate');

    if (search || city || state || status || startDate || endDate) {
      const filters: Partial<EventFilters> = {
        search,
        city,
        state,
        status: this.toEventStatus(status),
        startDate,
        endDate,
      };
      this.store.updateFilters(filters);
      this.draftFilters.set(this.createDraftFromFilters({ ...this.store.filters(), ...filters }));
      return;
    }

    this.store.loadEvents();
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
      status: filters.status || null,
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      size: filters.size,
      sort: filters.sort,
    });
  }

  clearFilters(): void {
    this.store.clearFilters();
    this.draftFilters.set(this.createDraftFromFilters(this.store.filters()));
  }

  filterCity(city: string | null): void {
    this.draftFilters.update((filters) => ({ ...filters, city: city ?? '' }));
    this.applyFilters();
  }

  updatePageSize(size: string): void {
    const normalizedSize = Number(size);
    this.draftFilters.update((filters) => ({ ...filters, size: normalizedSize }));
    this.store.changePageSize(normalizedSize);
  }

  previousPage(): void {
    this.store.changePage(this.store.currentPage() - 1);
  }

  nextPage(): void {
    this.store.changePage(this.store.currentPage() + 1);
  }

  hasActiveFilters(): boolean {
    const filters = this.store.filters();
    return Boolean(filters.search || filters.city || filters.state || filters.status || filters.startDate || filters.endDate);
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

  statusLabel(status: EventStatus | null | undefined): string {
    return eventStatusLabel(status);
  }

  private createDraftFromFilters(filters: EventFilters | Partial<EventFilters>): ShowsFilterDraft {
    return {
      search: filters.search ?? '',
      city: filters.city ?? '',
      state: filters.state ?? '',
      status: filters.status ?? '',
      startDate: this.dateInputValue(filters.startDate ?? null),
      endDate: this.dateInputValue(filters.endDate ?? null),
      size: filters.size ?? 12,
      sort: filters.sort ?? 'eventDate,asc',
    };
  }

  private toEventStatus(status: string | null): EventStatus | null {
    return status === 'SCHEDULED' || status === 'CANCELED' || status === 'FINISHED' ? status : null;
  }
}
