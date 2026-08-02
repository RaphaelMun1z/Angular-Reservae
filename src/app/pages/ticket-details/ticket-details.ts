import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { TicketStore } from '../my-tickets/state/ticket.store';
import { ticketStatusLabel, ticketTypeLabel } from '../../shared/presentation-labels';
import { Ticket } from '../../core/models/ticket.model';

@Component({
  selector: 'app-ticket-details',
  imports: [RouterLink, QRCodeComponent, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.scss',
})
export class TicketDetails implements OnInit {
  readonly store = inject(TicketStore);
  readonly qrExpanded = signal(false);
  private readonly title = inject(Title);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      const eventName = this.store.selectedTicket()?.eventTitle?.trim();
      this.title.setTitle(eventName ? `Reservae | Ingresso - ${eventName}` : 'Reservae | Ingresso');
    });
  }

  statusTone(status?: string): string {
    switch (status) {
      case 'VALID':
      case 'USED':
      case 'REVOKED':
      case 'EXPIRED':
        return status.toLowerCase();
      default:
        return 'unknown';
    }
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

  toggleQrCode(): void {
    this.qrExpanded.update((expanded) => !expanded);
  }

  closeQrCode(): void {
    this.qrExpanded.set(false);
  }

  eventName(ticket: Ticket): string {
    return ticket.eventTitle || 'Evento nao informado';
  }

  eventDateLabel(ticket: Ticket): string {
    const date = this.formatEventDate(ticket.eventDate);
    return date || 'Data a confirmar';
  }

  eventTimeLabel(ticket: Ticket): string {
    if (!ticket.eventDate) {
      return 'Horário a confirmar';
    }

    const date = new Date(ticket.eventDate);
    if (Number.isNaN(date.getTime())) {
      return 'Horário a confirmar';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  eventLocationLabel(ticket: Ticket): string {
    const cityState = [ticket.venueCity, ticket.venueState].filter(Boolean).join(', ');
    return [ticket.venueName, cityState].filter(Boolean).join(' - ') || 'Local a confirmar';
  }

  sectorName(ticket: Ticket): string {
    return ticket.sectorName || (ticket.sectorId ? `Setor ${ticket.sectorId}` : 'Setor nao informado');
  }

  isTransferable(status?: string): boolean {
    return status === 'VALID';
  }

  transferRestrictionMessage(status?: string): string {
    switch (status) {
      case 'USED':
        return 'Este ingresso ja foi utilizado e nao pode ser transferido.';
      case 'REVOKED':
        return 'Este ingresso foi revogado e nao pode ser transferido.';
      case 'EXPIRED':
        return 'Este ingresso expirou e nao pode ser transferido.';
      default:
        return 'A transferencia nao esta disponivel para este ingresso.';
    }
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Nao informado';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');

    if (ticketId) {
      this.store.loadTicket(ticketId);
    } else {
      this.store.setError('Ingresso nao identificado na rota.');
    }
  }

  private formatEventDate(value: string | null | undefined): string {
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
    });
  }
}
