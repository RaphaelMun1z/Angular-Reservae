import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminShell } from '../../components/admin-shell/admin-shell';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { EventStatus } from '../../core/models/event-catalog.model';
import { EventStore } from './state/event.store';

@Component({
  selector: 'app-events',
  imports: [FormsModule, RouterLink, AdminShell, SkeletonLoader],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  readonly store = inject(EventStore);
  readonly statuses: readonly EventStatus[] = ['SCHEDULED', 'CANCELED', 'FINISHED'];

  ngOnInit(): void {
    this.store.loadEvents();
  }

  search(search: string): void {
    this.store.searchByTitle(search);
  }

  updateCity(city: string): void {
    this.store.updateFilters({ city });
  }

  updateState(state: string): void {
    this.store.updateFilters({ state });
  }

  updateStatus(status: string): void {
    this.store.updateFilters({ status: status ? (status as EventStatus) : null });
  }

  updateStartDate(date: string): void {
    this.store.updateFilters({ startDate: date || null });
  }

  updateEndDate(date: string): void {
    this.store.updateFilters({ endDate: date || null });
  }

  updatePageSize(size: string): void {
    this.store.changePageSize(Number(size));
  }

  previousPage(): void {
    this.store.changePage(this.store.currentPage() - 1);
  }

  nextPage(): void {
    this.store.changePage(this.store.currentPage() + 1);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Data indisponivel';
    }

    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  dateInputValue(value: string | null): string {
    return value ? value.slice(0, 10) : '';
  }

  statusLabel(status: EventStatus | null | undefined): string {
    const labels: Record<EventStatus, string> = {
      SCHEDULED: 'Agendado',
      CANCELED: 'Cancelado',
      FINISHED: 'Finalizado',
    };

    return status ? labels[status] : 'Sem status';
  }
}
