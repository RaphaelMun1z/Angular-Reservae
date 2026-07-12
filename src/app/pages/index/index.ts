import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { EventStore } from '../events/state/event.store';

@Component({
  selector: 'app-index',
  imports: [RouterLink, UserMenu],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index {
  readonly eventStore = inject(EventStore);
}
