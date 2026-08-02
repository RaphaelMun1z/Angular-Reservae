import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserMenu } from '../user-menu/user-menu';
import { CheckoutStore } from '../../features/checkout/state/checkout.store';
import { AuthStore } from '../../core/state/auth.store';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly iconPath: string;
}

@Component({
  selector: 'app-site-navbar',
  imports: [RouterLink, RouterLinkActive, UserMenu],
  templateUrl: './site-navbar.html',
  styleUrl: './site-navbar.scss',
})
export class SiteNavbar {
  protected readonly checkoutStore = inject(CheckoutStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly showDashboard = computed(() => this.authStore.isAdmin() || this.authStore.isSupport());
  protected readonly showOrganizer = computed(() => this.authStore.isOrganizer() || this.authStore.isAdmin());
  protected readonly showCart = computed(() => !this.showDashboard() && !this.showOrganizer());

  private readonly allNavItems: readonly NavItem[] = [
    {
      label: 'Inicio',
      path: '/inicio',
      iconPath: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z',
    },
    {
      label: 'Eventos',
      path: '/shows',
      iconPath: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
    },
    {
      label: 'Club VIP',
      path: '/club-vip',
      iconPath: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
    },
    {
      label: 'Suporte',
      path: '/suporte',
      iconPath: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z',
    },
  ];

  protected readonly navItems = computed<readonly NavItem[]>(() => {
    if (this.authStore.isOrganizer() && !this.authStore.isAdmin()) {
      return this.allNavItems.filter((item) => item.path !== '/shows' && item.path !== '/club-vip');
    }

    return this.allNavItems;
  });

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
