import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Filter, Info, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Search } from 'lucide-angular';
import { eventStatusLabel } from '../../../../shared/presentation/presentation-labels';
import { OrganizerStore } from '../../state/organizer.store';

@Component({
  selector: 'app-organizer-events',
  imports: [FormsModule, RouterLink, DatePipe, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Filter, Info, Search }) }],
  template: `
    <main class="organizer-page">
      <header class="page-header">
        <div><h1>Gerencie seus eventos</h1></div>
        <a class="button primary" routerLink="/organizer/management/events/create">Criar evento</a>
      </header>
      <section class="event-filters" aria-label="Filtros de eventos">
        <div class="event-filters-title"><lucide-icon name="filter" size="18" aria-hidden="true"></lucide-icon><div><strong>Filtros</strong></div></div>
        <div class="event-filter-controls">
          <label class="event-filter-field"><span>Buscar eventos</span><div class="event-input-control"><lucide-icon name="search" size="17" aria-hidden="true"></lucide-icon><input aria-label="Buscar evento" placeholder="Nome do evento" [ngModel]="store.search()" (ngModelChange)="store.setSearch($event)" /></div></label>
          <label class="event-filter-field"><span>Status</span><select aria-label="Filtrar por status" [ngModel]="store.status()" (ngModelChange)="store.setStatus($event)"><option value="ALL">Todos os status</option><option value="SCHEDULED">Agendados</option><option value="CANCELED">Cancelados</option><option value="FINISHED">Finalizados</option></select></label>
        </div>
      </section>
      @if (store.loading()) { <p class="card">Carregando eventos...</p> }
      @else if (store.error()) { <p class="notice">{{ store.error() }}</p> }
      @else if (store.eventsLoaded() && !store.hasEvents()) { <section class="empty-state"><strong>Nenhum evento encontrado no momento.</strong><span>Ajuste os filtros ou verifique a disponibilidade dos dados de ownership.</span></section> }
      @else {
        <section class="card table-wrap"><table><thead><tr><th>Evento</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          @for (event of store.events(); track event.id) {
            <tr><td><strong>{{ event.name }}</strong><br><span class="muted">{{ event.venueName }} · {{ event.city }}</span></td><td>{{ event.date | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ eventStatusLabel(event.status) }}</td><td><a class="event-consult-link" [routerLink]="['/organizer/management/events', event.id]"><lucide-icon name="info" size="16" aria-hidden="true"></lucide-icon>Consultar</a></td></tr>
          }
        </tbody></table></section>
      }
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerEvents implements OnInit {
  protected readonly store = inject(OrganizerStore);
  protected readonly eventStatusLabel = eventStatusLabel;

  ngOnInit(): void {
    this.store.loadEvents();
  }
}
