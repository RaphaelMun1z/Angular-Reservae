import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { Ticket, TicketStatus } from '../../core/models/ticket.model';
import { TicketStore } from './state/ticket.store';
import { AuthStore } from '../../core/state/auth.store';
import { ticketStatusLabel, ticketTypeLabel } from '../../shared/presentation-labels';
import { EventDisplayData, EventDisplayDataService } from '../../shared/event-display-data.service';

@Component({
  selector: 'app-my-tickets',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.scss',
})
export class MyTickets implements OnInit {
  readonly store = inject(TicketStore);
  readonly authStore = inject(AuthStore);
  private readonly eventDisplayData = inject(EventDisplayDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventData = signal<Record<string, EventDisplayData | null>>({});
  private readonly loadingEventIds = signal<Record<string, boolean>>({});
  private readonly failedEventIds = signal<Record<string, boolean>>({});

  constructor() {
    effect(() => {
      const eventIds = Array.from(
        new Set(this.store.tickets().map((ticket) => ticket.eventId).filter((eventId): eventId is string => Boolean(eventId))),
      );

      eventIds.forEach((eventId) => queueMicrotask(() => this.loadEventData(eventId)));
    });
  }

  ngOnInit(): void {
    this.store.loadTickets();
  }

  setFilter(status: TicketStatus | null): void {
    this.store.setStatusFilter(status);
  }

  statusLabel(status?: string): string {
    return ticketStatusLabel(status);
  }

  ticketTypeLabel(ticketType?: string): string {
    return ticketTypeLabel(ticketType);
  }

  eventName(ticket: Ticket): string {
    const eventId = ticket.eventId;

    if (!eventId) {
      return 'Evento nao informado';
    }

    return this.eventData()[eventId]?.event?.name || (this.isEventLoading(eventId) ? 'Carregando evento...' : 'Evento nao identificado');
  }

  eventMeta(ticket: Ticket): string {
    const eventId = ticket.eventId;

    if (!eventId) {
      return 'Detalhes do evento indisponiveis';
    }

    const event = this.eventData()[eventId]?.event;
    const date = this.formatDate(event?.date);
    const location = this.eventLocation(event);

    if (date && location) {
      return `${date} - ${location}`;
    }

    return date || location || (this.hasEventLoadFailed(eventId) ? 'Detalhes do evento indisponiveis' : 'Carregando detalhes...');
  }

  sectorName(ticket: Ticket): string {
    const eventId = ticket.eventId;
    const sectorId = ticket.sectorId;

    if (!sectorId) {
      return 'Setor nao informado';
    }

    const sector = eventId ? this.eventData()[eventId]?.sectors.find((currentSector) => currentSector.id === sectorId) : null;
    return sector?.name || (eventId && this.isEventLoading(eventId) ? 'Carregando setor...' : `Setor ${sectorId}`);
  }

  isEventLoading(eventId: string | undefined): boolean {
    return eventId ? Boolean(this.loadingEventIds()[eventId]) : false;
  }

  hasEventLoadFailed(eventId: string | undefined): boolean {
    return eventId ? Boolean(this.failedEventIds()[eventId]) : false;
  }

  private loadEventData(eventId: string): void {
    if (this.eventData()[eventId] !== undefined || this.loadingEventIds()[eventId]) {
      return;
    }

    this.loadingEventIds.update((ids) => ({ ...ids, [eventId]: true }));
    this.failedEventIds.update((ids) => ({ ...ids, [eventId]: false }));

    this.eventDisplayData
      .getEventData(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventData) => {
          this.eventData.update((currentData) => ({ ...currentData, [eventId]: eventData }));
          this.loadingEventIds.update((ids) => ({ ...ids, [eventId]: false }));
        },
        error: () => {
          this.eventData.update((currentData) => ({ ...currentData, [eventId]: null }));
          this.loadingEventIds.update((ids) => ({ ...ids, [eventId]: false }));
          this.failedEventIds.update((ids) => ({ ...ids, [eventId]: true }));
        },
      });
  }

  private eventLocation(event: EventDisplayData['event'] | undefined): string {
    const cityState = [event?.city, event?.state].filter(Boolean).join(', ');
    return [event?.venueName, cityState].filter(Boolean).join(' - ');
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
