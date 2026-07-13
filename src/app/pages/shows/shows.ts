import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { EventStatus } from '../../core/models/event-catalog.model';
import { EventStore } from '../events/state/event.store';

@Component({
  selector: 'app-shows',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './shows.html',
  styleUrl: './shows.scss',
})
export class Shows implements OnInit {
  readonly store = inject(EventStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const city = query.get('city');
    const state = query.get('state');
    const status = query.get('status');

    if (city || state || status) {
      this.store.updateFilters({
        city,
        state,
        status: this.toEventStatus(status),
      });
      return;
    }

    this.store.loadEvents();
  }

  filterCity(city: string | null): void {
    this.store.updateFilters({ city });
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

  private toEventStatus(status: string | null): EventStatus | null {
    return status === 'SCHEDULED' || status === 'CANCELED' || status === 'FINISHED' ? status : null;
  }
}
