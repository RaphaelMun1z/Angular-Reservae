import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketStore } from '../my-tickets/state/ticket.store';

@Component({
  selector: 'app-ticket-transfer',
  imports: [RouterLink],
  templateUrl: './ticket-transfer.html',
  styleUrl: './ticket-transfer.scss',
})
export class TicketTransfer {
  readonly store = inject(TicketStore);
}
