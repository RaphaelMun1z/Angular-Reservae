import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { OrganizerVenueApi } from '../../data-access/organizer-venue.api';
import { OrganizerVenue } from '../../organizer-venue.models';

@Component({
  selector: 'app-organizer-venues',
  imports: [RouterLink],
  template: `
    <main class="organizer-page">
      <header class="page-header"><div><h1>Locais</h1></div><a class="button secondary" routerLink="/organizer/management">Voltar</a></header>
      @if (loading()) { <p class="card">Carregando locais...</p> }
      @else if (error()) { <p class="notice">{{ error() }}</p> }
      @else if (!venues().length) { <section class="empty-state"><strong>Nenhum local encontrado.</strong><span>Não há locais disponíveis nos dados retornados pelo backend.</span></section> }
      @else { <section class="card table-wrap"><table><thead><tr><th>Local</th><th>Região</th><th>Capacidade</th><th>Setores</th></tr></thead><tbody>@for (venue of venues(); track venue.id) {<tr><td><strong>{{ venue.name || 'Nome indisponível' }}</strong></td><td>{{ venue.city ?? 'Indisponível' }}{{ venue.state ? ' / ' + venue.state : '' }}</td><td>{{ venue.totalCapacity ?? 'Indisponível' }}</td><td>{{ venue.sectors.length }}</td></tr>}</tbody></table></section>}
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerVenues implements OnInit {
  private readonly api = inject(OrganizerVenueApi);
  protected readonly venues = signal<readonly OrganizerVenue[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.api.list().pipe(catchError(() => { this.error.set('Não foi possível carregar os locais no momento.'); return of([] as readonly OrganizerVenue[]); }), finalize(() => this.loading.set(false))).subscribe((venues) => this.venues.set(venues));
  }
}
