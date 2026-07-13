import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { TicketStatus } from '../../core/models/ticket.model';
import { TicketStore } from './state/ticket.store';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-my-tickets',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
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
}
