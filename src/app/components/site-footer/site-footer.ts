import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/state/auth.store';

interface FooterLink {
  readonly label: string;
  readonly path: string;
}

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  private readonly authStore = inject(AuthStore);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly accountLinks = computed<readonly FooterLink[]>(() => {
    if (!this.authStore.authenticated()) {
      return [{ label: 'Entrar', path: '/login' }];
    }

    if (this.authStore.isCustomer()) {
      return [
        { label: 'Perfil', path: '/perfil' },
        { label: 'Meus ingressos', path: '/meus-ingressos' },
        { label: 'Meus pedidos', path: '/meus-pedidos' },
      ];
    }

    return [
      { label: 'Perfil', path: '/perfil' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Configuracoes', path: '/configuracoes' },
    ];
  });
}
