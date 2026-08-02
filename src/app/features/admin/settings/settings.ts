import { Component, HostListener, computed, effect, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { UserMenu } from '../../../layouts/user-menu/user-menu';

type AdminNavItem = {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly link: string;
  readonly exact: boolean;
  readonly fragment?: string;
};

@Component({
  selector: 'app-settings',
  imports: [
    RouterLink,
    RouterLinkActive,
    UserMenu,
    LucideAngularModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  host: {
    '[class.sidebar-collapsed]': 'sidebarCollapsed()',
    '[class.mobile-sidebar-open]': 'mobileSidebarOpen()',
  },
})
export class Settings {
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileSidebarOpen = signal(false);
  protected readonly activeTab = signal<'geral' | 'pagamentos' | 'equipe'>('geral');

  protected readonly menuButtonLabel = computed(() =>
    this.mobileSidebarOpen() ? 'Fechar menu administrativo' : 'Abrir menu administrativo',
  );
  protected menuExpanded(): boolean {
    return this.isMobileViewport() ? this.mobileSidebarOpen() : !this.sidebarCollapsed();
  }

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

  protected selectTab(tab: 'geral' | 'pagamentos' | 'equipe'): void {
    this.activeTab.set(tab);
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
    return window.matchMedia('(max-width: 767px)').matches;
  }
}
