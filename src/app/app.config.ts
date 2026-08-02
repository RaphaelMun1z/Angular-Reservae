import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
  ReceiptText,
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
import { CHECKOUT_API } from './core/http/contracts/checkout.contracts';
import { EVENT_API } from './core/http/contracts/events.contracts';
import { SCANNER_API } from './core/http/contracts/scanner.contracts';
import { TICKET_API } from './core/http/contracts/tickets.contracts';
import { HttpCheckoutApi } from './features/checkout/data-access/http-checkout.api';
import { HttpEventApi } from './features/events/data-access/http-event.api';
import { HttpScannerApi } from './features/admin/scanner/data-access/http-scanner.api';
import { HttpTicketApi } from './features/tickets/data-access/http-ticket.api';
import { provideAuth } from './core/state/auth.providers';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
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
        ReceiptText,
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
