import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import { Ticket, TicketStatus } from '../../core/models/ticket.model';
import { TicketStore } from './state/ticket.store';
import { AuthStore } from '../../core/state/auth.store';
import { ticketStatusLabel, ticketTypeLabel } from '../../shared/presentation-labels';

@Component({
  selector: 'app-my-tickets',
    imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader, EmptyStateComponent],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.scss',
})
export class MyTickets implements OnInit {
  readonly store = inject(TicketStore);
  readonly authStore = inject(AuthStore);
  ngOnInit(): void {
    this.store.loadTickets();
  }

  setFilter(status: TicketStatus | null): void {
    this.store.setStatusFilter(status);
  }

  statusLabel(status?: string): string {
    return ticketStatusLabel(status);
  }

  statusIconPath(status?: string): string {
    if (status === 'VALID') {
      return 'm5 12 4 4L19 6';
    }

    if (status === 'REVOKED' || status === 'EXPIRED') {
      return 'm8 8 8 8M16 8l-8 8';
    }

    return 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
  }

  ticketTypeLabel(ticketType?: string): string {
    return ticketTypeLabel(ticketType);
  }

  eventName(ticket: Ticket): string {
    return ticket.eventTitle || 'Evento nao informado';
  }

  eventMeta(ticket: Ticket): string {
    const date = this.formatDate(ticket.eventDate);
    const location = [ticket.venueName, [ticket.venueCity, ticket.venueState].filter(Boolean).join(', ')].filter(Boolean).join(' - ');

    if (date && location) {
      return `${date} - ${location}`;
    }

    return date || location || 'Detalhes do evento indisponiveis';
  }

  sectorName(ticket: Ticket): string {
    return ticket.sectorName || (ticket.sectorId ? `Setor ${ticket.sectorId}` : 'Setor nao informado');
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
