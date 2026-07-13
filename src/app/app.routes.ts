import { Routes } from '@angular/router';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { ClubVip } from './pages/club-vip/club-vip';
import { CreateEvent } from './pages/create-event/create-event';
import { Dashboard } from './pages/dashboard/dashboard';
import { Error403 } from './pages/errors/error403/error403';
import { Error404 } from './pages/errors/error404/error404';
import { Error500 } from './pages/errors/error500/error500';
import { Error503 } from './pages/errors/error503/error503';
import { Events } from './pages/events/events';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { GateScanner } from './pages/gate-scanner/gate-scanner';
import { HomePage } from './pages/home-page/home-page';
import { Index } from './pages/index/index';
import { Login } from './pages/login/login';
import { MyTickets } from './pages/my-tickets/my-tickets';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';
import { Review } from './pages/review/review';
import { SectorSelection } from './pages/sector-selection/sector-selection';
import { Settings } from './pages/settings/settings';
import { Shows } from './pages/shows/shows';
import { Success } from './pages/success/success';
import { Support } from './pages/support/support';
import { TicketDetails } from './pages/ticket-details/ticket-details';
import { TicketTransfer } from './pages/ticket-transfer/ticket-transfer';
import { CheckoutStore } from './pages/checkout/state/checkout.store';
import { EventStore } from './pages/events/state/event.store';
import { ScannerStore } from './pages/gate-scanner/state/scanner.store';
import { TicketStore } from './pages/my-tickets/state/ticket.store';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: '',
    providers: [CheckoutStore, EventStore, TicketStore],
    children: [
      {
        path: 'inicio',
        component: HomePage,
      },
      {
        path: 'index',
        component: Index,
      },
      {
        path: 'carrinho',
        component: Cart,
      },
      {
        path: 'checkout',
        component: Checkout,
        canActivate: [authGuard],
      },
      {
        path: 'checkout/:eventId',
        component: Checkout,
        canActivate: [authGuard],
      },
      {
        path: 'club-vip',
        component: ClubVip,
      },
      {
        path: 'criar-evento',
        component: CreateEvent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'clientes',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'transacoes',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'relatorios',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'eventos',
        component: Events,
      },
      {
        path: 'recuperar-senha',
        component: ForgotPassword,
      },
      {
        path: 'scanner',
        component: GateScanner,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        providers: [ScannerStore],
      },
      {
        path: 'scanner/:eventId',
        component: GateScanner,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        providers: [ScannerStore],
      },
      {
        path: 'login',
        component: Login,
      },
      {
        path: 'meus-ingressos',	
        component: MyTickets,
        canActivate: [authGuard],
      },
      {
        path: 'perfil',
        component: Profile,
        canActivate: [authGuard],
      },
      {
        path: 'cadastro',
        component: Register,
      },
      {
        path: 'avaliacao',
        component: Review,
      },
      {
        path: 'selecionar-setor',
        component: SectorSelection,
      },
      {
        path: 'selecionar-setor/:eventId',
        component: SectorSelection,
      },
      {
        path: 'configuracoes',
        component: Settings,
        canActivate: [authGuard],
      },
      {
        path: 'shows',
        component: Shows,
      },
      {
        path: 'sucesso',
        component: Success,
      },
      {
        path: 'suporte',
        component: Support,
      },
      {
        path: 'detalhes-ingresso',
        component: TicketDetails,
        canActivate: [authGuard],
      },
      {
        path: 'detalhes-ingresso/:ticketId',
        component: TicketDetails,
        canActivate: [authGuard],
      },
      {
        path: 'transferir-ingresso',
        component: TicketTransfer,
        canActivate: [authGuard],
      },
      {
        path: '403',
        component: Error403,
      },
      {
        path: '404',
        component: Error404,
      },
      {
        path: '500',
        component: Error500,
      },
      {
        path: '503',
        component: Error503,
      },
      {
        path: '**',
        component: Error404,
      },
    ],
  },
];
