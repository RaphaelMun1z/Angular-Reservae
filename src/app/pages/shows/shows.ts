import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { EventStore } from '../events/state/event.store';

@Component({
  selector: 'app-shows',
  imports: [RouterLink, UserMenu],
  templateUrl: './shows.html',
  styleUrl: './shows.scss',
})
export class Shows implements OnInit {
  readonly store = inject(EventStore);

  ngOnInit(): void {
    this.store.markCatalogListPending();
  }
}
