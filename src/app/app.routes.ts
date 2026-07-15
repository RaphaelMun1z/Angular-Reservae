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
import { MyOrders } from './pages/my-orders/my-orders';
import { MyTickets } from './pages/my-tickets/my-tickets';
import { OrderCreated } from './pages/order-created/order-created';
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
        title: 'Reservae | Inicio',
      },
      {
        path: 'index',
        component: Index,
        title: 'Reservae | Inicio',
      },
      {
        path: 'carrinho',
        component: Cart,
        title: 'Reservae | Carrinho',
      },
      {
        path: 'checkout',
        component: Checkout,
        canActivate: [authGuard],
        title: 'Reservae | Checkout',
      },
      {
        path: 'checkout/:eventId',
        component: Checkout,
        canActivate: [authGuard],
        title: 'Reservae | Checkout',
      },
      {
        path: 'club-vip',
        component: ClubVip,
        title: 'Reservae | Club VIP',
      },
      {
        path: 'criar-evento',
        component: CreateEvent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Reservae | Criar evento',
      },
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Reservae | Dashboard',
      },
      {
        path: 'clientes',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Reservae | Clientes',
      },
      {
        path: 'transacoes',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Reservae | Transacoes',
      },
      {
        path: 'relatorios',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Reservae | Relatorios',
      },
      {
        path: 'eventos',
        component: Events,
        title: 'Reservae | Eventos',
      },
      {
        path: 'recuperar-senha',
        component: ForgotPassword,
        title: 'Reservae | Recuperar senha',
      },
      {
        path: 'scanner',
        component: GateScanner,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        providers: [ScannerStore],
        title: 'Reservae | Validacao de ingresso',
      },
      {
        path: 'scanner/:eventId',
        component: GateScanner,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        providers: [ScannerStore],
        title: 'Reservae | Validacao de ingresso',
      },
      {
        path: 'login',
        component: Login,
        title: 'Reservae | Entrar',
      },
      {
        path: 'meus-ingressos',	
        component: MyTickets,
        canActivate: [authGuard],
        title: 'Reservae | Meus ingressos',
      },
      {
        path: 'meus-pedidos',
        component: MyOrders,
        canActivate: [authGuard],
        title: 'Reservae | Meus pedidos',
      },
      {
        path: 'perfil',
        component: Profile,
        canActivate: [authGuard],
        title: 'Reservae | Perfil',
      },
      {
        path: 'cadastro',
        component: Register,
        title: 'Reservae | Cadastro',
      },
      {
        path: 'avaliacao',
        component: Review,
        title: 'Reservae | Avaliacao',
      },
      {
        path: 'selecionar-setor',
        component: SectorSelection,
        title: 'Reservae | Detalhes do evento',
      },
      {
        path: 'selecionar-setor/:eventId',
        component: SectorSelection,
        title: 'Reservae | Detalhes do evento',
      },
      {
        path: 'configuracoes',
        component: Settings,
        canActivate: [authGuard],
        title: 'Reservae | Configuracoes',
      },
      {
        path: 'shows',
        component: Shows,
        title: 'Reservae | Eventos',
      },
      {
        path: 'sucesso',
        component: Success,
        title: 'Reservae | Sucesso',
      },
      {
        path: 'order-created',
        component: OrderCreated,
        title: 'Reservae | Pedido',
      },
      {
        path: 'suporte',
        component: Support,
        title: 'Reservae | Suporte',
      },
      {
        path: 'detalhes-ingresso',
        component: TicketDetails,
        canActivate: [authGuard],
        title: 'Reservae | Detalhes do ingresso',
      },
      {
        path: 'detalhes-ingresso/:ticketId',
        component: TicketDetails,
        canActivate: [authGuard],
        title: 'Reservae | Detalhes do ingresso',
      },
      {
        path: 'transferir-ingresso',
        component: TicketTransfer,
        canActivate: [authGuard],
        title: 'Reservae | Transferir ingresso',
      },
      {
        path: '403',
        component: Error403,
        title: 'Reservae | Acesso negado',
      },
      {
        path: '404',
        component: Error404,
        title: 'Reservae | Pagina nao encontrada',
      },
      {
        path: '500',
        component: Error500,
        title: 'Reservae | Erro interno',
      },
      {
        path: '503',
        component: Error503,
        title: 'Reservae | Servico indisponivel',
      },
      {
        path: '**',
        component: Error404,
        title: 'Reservae | Pagina nao encontrada',
      },
    ],
  },
];
