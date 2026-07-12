import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  Gauge,
  Handshake,
  LogOut,
  Mail,
  Menu,
  Percent,
  QrCode,
  Receipt,
  Save,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  UserCircle,
  Users,
  X,
  LUCIDE_ICONS,
  LucideIconProvider,
} from 'lucide-angular';

import { routes } from './app.routes';
import { CHECKOUT_API } from './pages/checkout/state/checkout.store';
import { EVENT_API } from './pages/events/state/event.store';
import { SCANNER_API } from './pages/gate-scanner/state/scanner.store';
import { TICKET_API } from './pages/my-tickets/state/ticket.store';
import { HttpCheckoutApi } from './core/services/http-checkout.api';
import { HttpEventApi } from './core/services/http-event.api';
import { HttpScannerApi } from './core/services/http-scanner.api';
import { HttpTicketApi } from './core/services/http-ticket.api';
import { provideAuth } from './core/state/auth.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideAuth(),
    { provide: EVENT_API, useClass: HttpEventApi },
    { provide: CHECKOUT_API, useClass: HttpCheckoutApi },
    { provide: TICKET_API, useClass: HttpTicketApi },
    { provide: SCANNER_API, useClass: HttpScannerApi },
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Bell,
        CalendarDays,
        ChartNoAxesCombined,
        CreditCard,
        Gauge,
        Handshake,
        LogOut,
        Mail,
        Menu,
        Percent,
        QrCode,
        Receipt,
        Save,
        Search,
        Settings: SettingsIcon,
        ShieldCheck,
        SlidersHorizontal,
        Ticket,
        UserCircle,
        Users,
        X,
      }),
    },
  ]
};
