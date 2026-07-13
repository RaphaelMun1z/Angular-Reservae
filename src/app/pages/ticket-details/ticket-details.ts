import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { SkeletonLoader } from '../../components/skeleton-loader/skeleton-loader';
import { TicketStore } from '../my-tickets/state/ticket.store';

@Component({
  selector: 'app-ticket-details',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.scss',
})
export class TicketDetails implements OnInit {
  readonly store = inject(TicketStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('ticketId');

    if (ticketId) {
      this.store.loadTicket(ticketId);
    } else {
      this.store.setError('Ingresso nao identificado na rota.');
    }
  }
}
