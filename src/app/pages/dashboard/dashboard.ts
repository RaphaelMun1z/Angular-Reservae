import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminShell } from '../../components/admin-shell/admin-shell';

@Component({
  selector: 'app-dashboard',
  imports: [AdminShell],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  constructor(private readonly router: Router) {}

  protected get currentView(): 'dashboard' | 'clientes' | 'transacoes' | 'relatorios' {
    const path = this.router.url.split('?')[0].replace('/', '');

    if (path === 'clientes' || path === 'transacoes' || path === 'relatorios') {
      return path;
    }

    return 'dashboard';
  }

  protected get pageTitle(): string {
    switch (this.currentView) {
      case 'clientes':
        return 'Clientes';
      case 'transacoes':
        return 'Transacoes';
      case 'relatorios':
        return 'Relatorios';
      default:
        return 'Dashboard';
    }
  }
}
