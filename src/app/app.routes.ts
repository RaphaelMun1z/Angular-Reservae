import { Routes } from '@angular/router';
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
import { Loading } from './pages/loading/loading';
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
        path: 'carregando',
        component: Loading,
      },
      {
        path: 'checkout',
        component: Checkout,
      },
      {
        path: 'checkout/:eventId',
        component: Checkout,
      },
      {
        path: 'club-vip',
        component: ClubVip,
      },
      {
        path: 'criar-evento',
        component: CreateEvent,
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'clientes',
        component: Dashboard,
      },
      {
        path: 'transacoes',
        component: Dashboard,
      },
      {
        path: 'relatorios',
        component: Dashboard,
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
        providers: [ScannerStore],
      },
      {
        path: 'scanner/:eventId',
        component: GateScanner,
        providers: [ScannerStore],
      },
      {
        path: 'login',
        component: Login,
      },
      {
        path: 'meus-ingressos',	
        component: MyTickets,
      },
      {
        path: 'perfil',
        component: Profile,
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
      },
      {
        path: 'detalhes-ingresso/:ticketId',
        component: TicketDetails,
      },
      {
        path: 'transferir-ingresso',
        component: TicketTransfer,
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
