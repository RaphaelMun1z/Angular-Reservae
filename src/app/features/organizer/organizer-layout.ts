import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from '../../layouts/site-footer/site-footer';
import { SiteNavbar } from '../../layouts/site-navbar/site-navbar';

@Component({
  selector: 'app-organizer-layout',
  imports: [RouterOutlet, SiteNavbar, SiteFooter],
  template: `
    <app-site-navbar />
    <router-outlet />
    <app-site-footer />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      color: #f5f5f5;
      background:
        radial-gradient(circle at 82% -10%, rgb(255 98 77 / 11%), transparent 34rem),
        #050505;
    }
  `,
  standalone: true,
})
export class OrganizerLayout {}
