import { Component, HostListener, Input, effect, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Gauge,
  LogOut,
  Menu,
  QrCode,
  Receipt,
  Search,
  Settings,
  Ticket,
  UserCircle,
  Users,
  X,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
} from 'lucide-angular';
import { UserMenu } from '../user-menu/user-menu';

type AdminNavItem = {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly link: string;
  readonly exact: boolean;
};

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, UserMenu, LucideAngularModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Bell,
        CalendarDays,
        ChartNoAxesCombined,
        Gauge,
        LogOut,
        Menu,
        QrCode,
        Receipt,
        Search,
        Settings,
        Ticket,
        UserCircle,
        Users,
        X,
      }),
    },
  ],
  host: {
    '[class.sidebar-collapsed]': 'sidebarCollapsed()',
    '[class.mobile-sidebar-open]': 'mobileSidebarOpen()',
  },
})
export class AdminShell {
  @Input() breadcrumbRoot = 'Gestao';
  @Input() breadcrumbCurrent = 'Dashboard';

  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileSidebarOpen = signal(false);

  protected readonly navItems: readonly AdminNavItem[] = [
    {
      label: 'Dashboard',
      description: 'Visao geral da plataforma',
      icon: 'gauge',
      link: '/dashboard',
      exact: true,
    },
    {
      label: 'Eventos',
      description: 'Gerencie eventos e setores',
      icon: 'calendar-days',
      link: '/eventos',
      exact: true,
    },
    {
      label: 'Scanner',
      description: 'Valide ingressos nos portoes',
      icon: 'qr-code',
      link: '/scanner',
      exact: false,
    },
    {
      label: 'Clientes',
      description: 'Consulte usuarios e compradores',
      icon: 'users',
      link: '/clientes',
      exact: true,
    },
    {
      label: 'Transacoes',
      description: 'Acompanhe pedidos e pagamentos',
      icon: 'receipt',
      link: '/transacoes',
      exact: true,
    },
  ];

  protected readonly systemItems: readonly AdminNavItem[] = [
    {
      label: 'Relatorios',
      description: 'Analise vendas e acessos',
      icon: 'chart-no-axes-combined',
      link: '/relatorios',
      exact: true,
    },
    {
      label: 'Configuracoes',
      description: 'Ajuste parametros do sistema',
      icon: 'settings',
      link: '/configuracoes',
      exact: true,
    },
  ];

  constructor() {
    effect(() => {
      document.body.classList.toggle('admin-menu-open', this.mobileSidebarOpen());
    });
  }

  protected menuExpanded(): boolean {
    return this.isMobileViewport() ? this.mobileSidebarOpen() : !this.sidebarCollapsed();
  }

  protected toggleSidebar(): void {
    if (this.isMobileViewport()) {
      this.mobileSidebarOpen.update((isOpen) => !isOpen);
      return;
    }

    this.sidebarCollapsed.update((isCollapsed) => !isCollapsed);
  }

  protected closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  @HostListener('window:keydown.escape')
  protected closeOnEscape(): void {
    this.closeMobileSidebar();
  }

  @HostListener('window:resize')
  protected closeMobileMenuOnDesktop(): void {
    if (!this.isMobileViewport()) {
      this.closeMobileSidebar();
    }
  }

  private isMobileViewport(): boolean {
    if (typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(max-width: 767px)').matches;
  }
}
