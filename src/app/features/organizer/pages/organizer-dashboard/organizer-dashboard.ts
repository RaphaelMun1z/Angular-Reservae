import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CalendarDays, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, Plus } from 'lucide-angular';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ CalendarDays, MapPin, Plus }) }],
  template: `
    <main class="management-dashboard-page">
      <aside class="management-dashboard-sidebar">
        <nav class="management-dashboard-nav" aria-label="Navegação da gestão">
          <div class="management-nav-group">
            <a routerLink="/organizer/management/events" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><lucide-icon name="calendar-days" size="17" aria-hidden="true"></lucide-icon>Eventos</a>
            <div class="management-nav-children">
              <a routerLink="/organizer/management/events/create" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><lucide-icon name="plus" size="14" aria-hidden="true"></lucide-icon>Criar evento</a>
            </div>
          </div>
          <div class="management-nav-group">
            <a routerLink="/organizer/management/venues" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><lucide-icon name="map-pin" size="17" aria-hidden="true"></lucide-icon>Locais</a>
            <div class="management-nav-children">
              <a routerLink="/organizer/management/venues/create" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><lucide-icon name="plus" size="14" aria-hidden="true"></lucide-icon>Registrar local</a>
            </div>
          </div>
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
