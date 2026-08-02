import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../../../layouts/site-footer/site-footer';
import { SiteNavbar } from '../../../../layouts/site-navbar/site-navbar';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { Ticket, TicketStatus } from '../../../../core/models/ticket.model';
import { TicketStore } from '../../state/ticket.store';
import { AuthStore } from '../../../../core/state/auth.store';
import { ticketStatusLabel, ticketTypeLabel } from '../../../../shared/presentation/presentation-labels';

@Component({
  selector: 'app-my-tickets',
    imports: [RouterLink, FormsModule, SiteNavbar, SiteFooter, SkeletonLoader, EmptyStateComponent],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.scss',
})
export class MyTickets implements OnInit {
  readonly store = inject(TicketStore);
  readonly authStore = inject(AuthStore);
  readonly orderIdFilter = signal('');
  readonly expandedOrders = signal<ReadonlySet<string>>(new Set());
  readonly groupedTickets = computed<readonly TicketGroup[]>(() => {
    const groups = new Map<string, TicketGroup>();
    const orderIdFilter = this.orderIdFilter().trim().toLowerCase();

    for (const ticket of this.store.filteredTickets()) {
      if (orderIdFilter && !(ticket.orderId || '').toLowerCase().includes(orderIdFilter)) {
        continue;
      }

      const key = ticket.orderId || `ticket:${ticket.id || 'unknown'}`;
      const group = groups.get(key);

      if (group) {
        group.tickets.push(ticket);
      } else {
        groups.set(key, { key, orderId: ticket.orderId || null, tickets: [ticket] });
      }
    }

    return [...groups.values()];
  });

  setOrderIdFilter(value: string): void {
    this.orderIdFilter.set(value);
  }

  visibleTickets(group: TicketGroup): readonly Ticket[] {
    return this.isOrderExpanded(group.key) ? group.tickets : group.tickets.slice(0, 3);
  }

  isOrderExpanded(orderKey: string): boolean {
    return this.expandedOrders().has(orderKey);
  }

  toggleOrder(orderKey: string): void {
    this.expandedOrders.update((expanded) => {
      const next = new Set(expanded);
      if (next.has(orderKey)) {
        next.delete(orderKey);
      } else {
        next.add(orderKey);
      }
      return next;
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

interface TicketGroup {
  readonly key: string;
  readonly orderId: string | null;
  readonly tickets: Ticket[];
}
