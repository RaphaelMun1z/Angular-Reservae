import { Routes } from '@angular/router';
import { CheckoutStore } from './features/checkout/state/checkout.store';
import { EventStore } from './features/events/state/event.store';
import { HomePage } from './features/home/pages/home-page/home-page';
import { TicketStore } from './features/tickets/state/ticket.store';
import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';
import { checkoutRoutes } from './features/checkout/checkout.routes';
import { errorRoutes } from './features/errors/errors.routes';
import { eventRoutes } from './features/events/events.routes';
import { orderRoutes } from './features/orders/orders.routes';
import { profileRoutes } from './features/profile/profile.routes';
import { reviewRoutes } from './features/review/review.routes';
import { supportRoutes } from './features/support/support.routes';
import { ticketRoutes } from './features/tickets/tickets.routes';
import { organizerRoutes } from './features/organizer/organizer.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  {
    path: '',
    providers: [CheckoutStore, EventStore, TicketStore],
    children: [
      { path: 'inicio', component: HomePage, title: 'Reservae | Inicio' },
      ...eventRoutes,
      ...supportRoutes,
      ...checkoutRoutes,
      ...orderRoutes,
      ...ticketRoutes,
      ...profileRoutes,
      ...organizerRoutes,
      ...adminRoutes,
      ...authRoutes,
      ...reviewRoutes,
      ...errorRoutes,
    ],
  },
];
