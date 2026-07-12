import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminShell } from '../../components/admin-shell/admin-shell';
import { EventStore } from './state/event.store';

@Component({
  selector: 'app-events',
  imports: [RouterLink, AdminShell],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events implements OnInit {
  readonly store = inject(EventStore);

  ngOnInit(): void {
    this.store.markCatalogListPending();
  }
}
