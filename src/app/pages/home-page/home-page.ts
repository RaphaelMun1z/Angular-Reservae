import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { EventStore } from '../events/state/event.store';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, UserMenu],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  readonly eventStore = inject(EventStore);
}
