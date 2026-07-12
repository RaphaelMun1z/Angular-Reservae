import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { TicketStore } from '../my-tickets/state/ticket.store';

@Component({
  selector: 'app-ticket-details',
  imports: [RouterLink, UserMenu],
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
