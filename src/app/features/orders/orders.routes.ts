import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { roleGuard } from '../../core/auth/role.guard';

export const orderRoutes: Routes = [
  { path: 'meus-pedidos', loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Meus pedidos' },
  { path: 'detalhes-pedido/:orderId', loadComponent: () => import('./pages/order-details/order-details').then((m) => m.OrderDetails), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Detalhes do pedido' },
  { path: 'order-track', loadComponent: () => import('./pages/order-created/order-created').then((m) => m.OrderCreated), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Acompanhar pedido' },
  { path: 'sucesso', loadComponent: () => import('./pages/success/success').then((m) => m.Success), canActivate: [authGuard, roleGuard], data: { roles: ['CUSTOMER', 'ADMIN'] }, title: 'Reservae | Sucesso' },
];
