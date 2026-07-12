import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { TicketStatus } from '../../core/models/ticket.model';
import { TicketStore } from './state/ticket.store';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-my-tickets',
  imports: [RouterLink, UserMenu],
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
