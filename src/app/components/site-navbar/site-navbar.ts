import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserMenu } from '../user-menu/user-menu';
import { CheckoutStore } from '../../pages/checkout/state/checkout.store';

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
  protected readonly mobileMenuOpen = signal(false);

  protected readonly navItems: readonly NavItem[] = [
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
      iconPath: 'M9 18V5l12-2v13',
    },
    {
      label: 'Suporte',
      path: '/suporte',
      iconPath: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z',
    },
  ];

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
