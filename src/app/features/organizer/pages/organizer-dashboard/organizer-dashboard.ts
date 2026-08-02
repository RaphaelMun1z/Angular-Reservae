import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CalendarDays, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ CalendarDays, MapPin }) }],
  template: `
    <main class="management-dashboard-page">
      <aside class="management-dashboard-sidebar">
        <nav class="management-dashboard-nav" aria-label="Navegação da gestão">
          <a routerLink="/organizer/management/events" routerLinkActive="active"><lucide-icon name="calendar-days" size="17" aria-hidden="true"></lucide-icon>Eventos</a>
          <a routerLink="/organizer/management/venues" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><lucide-icon name="map-pin" size="17" aria-hidden="true"></lucide-icon>Locais</a>
        </nav>
      </aside>

      <section class="management-dashboard-content" aria-label="Conteúdo da gestão">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: '../../organizer.scss',
  standalone: true,
})
export class OrganizerDashboard {}
