import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { CheckoutStore } from './pages/checkout/state/checkout.store';
import { EventStore } from './pages/events/state/event.store';
import { ScannerStore } from './pages/gate-scanner/state/scanner.store';
import { TicketStore } from './pages/my-tickets/state/ticket.store';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

/** Rotas públicas que usam o shell da própria página (navbar/footer quando aplicável). */
const publicRoutes: Routes = [
  {
    path: 'inicio',
    component: HomePage,
    title: 'Reservae | Inicio',
  },
  {
    path: 'club-vip',
    loadComponent: () => import('./pages/club-vip/club-vip').then((m) => m.ClubVip),
    title: 'Reservae | Club VIP',
  },
  {
    path: 'eventos',
    loadComponent: () => import('./pages/events/events').then((m) => m.Events),
    title: 'Reservae | Eventos',
  },
  {
    path: 'shows',
    loadComponent: () => import('./pages/shows/shows').then((m) => m.Shows),
    title: 'Reservae | Eventos',
  },
  {
    path: 'suporte',
    loadComponent: () => import('./pages/support/support').then((m) => m.Support),
    title: 'Reservae | Suporte',
  },
  {
    path: 'selecionar-setor',
    loadComponent: () => import('./pages/sector-selection/sector-selection').then((m) => m.SectorSelection),
    title: 'Reservae | Detalhes do evento',
  },
  {
    path: 'selecionar-setor/:eventId',
    loadComponent: () => import('./pages/sector-selection/sector-selection').then((m) => m.SectorSelection),
    title: 'Reservae | Detalhes do evento',
  },
];

/** Rotas que exigem sessão, mantendo o authGuard no nível de cada URL. */
const authenticatedRoutes: Routes = [
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
    canActivate: [authGuard],
    title: 'Reservae | Checkout',
  },
  {
    path: 'checkout/:eventId',
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
    canActivate: [authGuard],
    title: 'Reservae | Checkout',
  },
  {
    path: 'meus-ingressos',
    loadComponent: () => import('./pages/my-tickets/my-tickets').then((m) => m.MyTickets),
    canActivate: [authGuard],
    title: 'Reservae | Meus ingressos',
  },
  {
    path: 'meus-pedidos',
    loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders),
    canActivate: [authGuard],
    title: 'Reservae | Meus pedidos',
  },
  {
    path: 'detalhes-pedido/:orderId',
    loadComponent: () => import('./pages/order-details/order-details').then((m) => m.OrderDetails),
    canActivate: [authGuard],
    title: 'Reservae | Detalhes do pedido',
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
    title: 'Reservae | Perfil',
  },
  {
    path: 'order-track',
    loadComponent: () => import('./pages/order-created/order-created').then((m) => m.OrderCreated),
    canActivate: [authGuard],
    title: 'Reservae | Acompanhar pedido',
  },
  {
    path: 'detalhes-ingresso',
    loadComponent: () => import('./pages/ticket-details/ticket-details').then((m) => m.TicketDetails),
    canActivate: [authGuard],
    title: 'Reservae | Detalhes do ingresso',
  },
  {
    path: 'detalhes-ingresso/:ticketId',
    loadComponent: () => import('./pages/ticket-details/ticket-details').then((m) => m.TicketDetails),
    canActivate: [authGuard],
    title: 'Reservae | Detalhes do ingresso',
  },
  {
    path: 'transferir-ingresso',
    loadComponent: () => import('./pages/ticket-transfer/ticket-transfer').then((m) => m.TicketTransfer),
    canActivate: [authGuard],
    title: 'Reservae | Transferir ingresso',
  },
];

/** Rotas administrativas/operacionais, com roles preservadas por URL. */
const adminRoutes: Routes = [
  {
    path: 'criar-evento',
    loadComponent: () => import('./pages/create-event/create-event').then((m) => m.CreateEvent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    title: 'Reservae | Criar evento',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'ORGANIZER', 'SUPPORT'] },
    title: 'Reservae | Dashboard',
  },
  {
    path: 'clientes',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    title: 'Reservae | Clientes',
  },
  {
    path: 'transacoes',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    title: 'Reservae | Transacoes',
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    title: 'Reservae | Relatorios',
  },
  {
    path: 'scanner',
    loadComponent: () => import('./pages/gate-scanner/gate-scanner').then((m) => m.GateScanner),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    providers: [ScannerStore],
    title: 'Reservae | Validacao de ingresso',
  },
  {
    path: 'scanner/:eventId',
    loadComponent: () => import('./pages/gate-scanner/gate-scanner').then((m) => m.GateScanner),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    providers: [ScannerStore],
    title: 'Reservae | Validacao de ingresso',
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'ORGANIZER', 'SUPPORT'] },
    title: 'Reservae | Configuracoes',
  },
];

/** Rotas isoladas, sem shell comum ou sem exigência de autenticação. */
const specialRoutes: Routes = [
  {
    path: 'carrinho',
    redirectTo: 'checkout',
    pathMatch: 'full',
  },
  {
    path: 'recuperar-senha',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    title: 'Reservae | Recuperar senha',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Reservae | Entrar',
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    title: 'Reservae | Cadastro',
  },
  {
    path: 'avaliacao',
    loadComponent: () => import('./pages/review/review').then((m) => m.Review),
    title: 'Reservae | Avaliacao',
  },
  {
    path: 'sucesso',
    loadComponent: () => import('./pages/success/success').then((m) => m.Success),
    title: 'Reservae | Sucesso',
  },
  {
    path: '403',
    loadComponent: () => import('./pages/errors/error403/error403').then((m) => m.Error403),
    title: 'Reservae | Acesso negado',
  },
  {
    path: '404',
    loadComponent: () => import('./pages/errors/error404/error404').then((m) => m.Error404),
    title: 'Reservae | Pagina nao encontrada',
  },
  {
    path: '500',
    loadComponent: () => import('./pages/errors/error500/error500').then((m) => m.Error500),
    title: 'Reservae | Erro interno',
  },
  {
    path: '503',
    loadComponent: () => import('./pages/errors/error503/error503').then((m) => m.Error503),
    title: 'Reservae | Servico indisponivel',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/errors/error404/error404').then((m) => m.Error404),
    title: 'Reservae | Pagina nao encontrada',
  },
];

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: '',
    providers: [CheckoutStore, EventStore, TicketStore],
    children: [...publicRoutes, ...authenticatedRoutes, ...adminRoutes, ...specialRoutes],
  },
];
