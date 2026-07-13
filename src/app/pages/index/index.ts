import { Component, inject } from '@angular/core';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { EventStore } from '../events/state/event.store';

@Component({
  selector: 'app-index',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index {
  readonly eventStore = inject(EventStore);
}
