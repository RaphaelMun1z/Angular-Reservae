import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { TicketStore } from '../my-tickets/state/ticket.store';
import { ticketStatusLabel, ticketTypeLabel } from '../../shared/presentation-labels';
import { EventDisplayData, EventDisplayDataService } from '../../shared/event-display-data.service';

@Component({
  selector: 'app-ticket-details',
  imports: [RouterLink, QRCodeComponent, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.scss',
})
export class TicketDetails implements OnInit {
  readonly store = inject(TicketStore);
  private readonly title = inject(Title);
  private readonly route = inject(ActivatedRoute);
  private readonly eventDisplayData = inject(EventDisplayDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventData = signal<EventDisplayData | null>(null);
  readonly eventDetailsLoading = signal(false);
  readonly eventDetailsError = signal(false);

  constructor() {
    effect(() => {
      const eventId = this.store.selectedTicket()?.eventId;

      if (eventId) {
        queueMicrotask(() => this.loadEventData(eventId));
        return;
      }

      if (this.store.selectedTicket()) {
        this.title.setTitle('Reservae | Ingresso');
      }
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

  ticketTypeLabel(ticketType?: string): string {
    return ticketTypeLabel(ticketType);
  }

  eventName(eventId?: string): string {
    if (!eventId) {
      return 'Evento nao informado';
    }

    return this.eventData()?.event?.name || (this.eventDetailsLoading() ? 'Carregando evento...' : 'Evento nao identificado');
  }

  eventMeta(): string {
    const event = this.eventData()?.event;
    const date = this.eventDateLabel();
    const location = this.eventLocationLabel();

    if (date !== 'Data a confirmar' && location !== 'Local a confirmar') {
      return `${date} - ${location}`;
    }

    if (date !== 'Data a confirmar') {
      return date;
    }

    if (location !== 'Local a confirmar') {
      return location;
    }

    return this.eventDetailsError() ? 'Detalhes do evento indisponiveis' : 'Detalhes do evento em carregamento';
  }

  eventDateLabel(): string {
    const date = this.formatEventDate(this.eventData()?.event?.date);
    return date || 'Data a confirmar';
  }

  eventLocationLabel(): string {
    return this.eventLocation(this.eventData()?.event) || 'Local a confirmar';
  }

  sectorName(sectorId?: string): string {
    if (!sectorId) {
      return 'Setor nao informado';
    }

    const sector = this.eventData()?.sectors.find((currentSector) => currentSector.id === sectorId);
    return sector?.name || (this.eventDetailsLoading() ? 'Carregando setor...' : `Setor ${sectorId}`);
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

  private loadEventData(eventId: string): void {
    if (this.eventData()?.event?.id === eventId || this.eventDetailsLoading()) {
      return;
    }

    this.eventDetailsLoading.set(true);
    this.eventDetailsError.set(false);

    this.eventDisplayData
      .getEventData(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventData) => {
          this.eventData.set(eventData);
          this.eventDetailsLoading.set(false);
          const eventName = eventData.event?.name?.trim();
          this.title.setTitle(eventName ? `Reservae | Ingresso - ${eventName}` : 'Reservae | Ingresso');
        },
        error: () => {
          this.eventData.set(null);
          this.eventDetailsLoading.set(false);
          this.eventDetailsError.set(true);
          this.title.setTitle('Reservae | Ingresso');
        },
      });
  }

  private eventLocation(event: EventDisplayData['event'] | undefined): string {
    const cityState = [event?.city, event?.state].filter(Boolean).join(', ');
    return [event?.venueName, cityState].filter(Boolean).join(' - ');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
