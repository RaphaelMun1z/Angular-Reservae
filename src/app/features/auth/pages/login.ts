import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/state/auth.store';
import { environment } from '../../../../environments/environment';

interface MockCredential {
  readonly email: string;
  readonly password: string;
  readonly label: string;
}

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly showMockCredentials = !environment.production;
  protected readonly mockCredentials: readonly MockCredential[] = [
    { email: 'admin@reservae.com', password: 'admin', label: 'Admin' },
    { email: 'organizer@reservae.com', password: 'organizer', label: 'Organizer' },
    { email: 'support@reservae.com', password: 'support', label: 'Support' },
    { email: 'customer@reservae.com', password: 'customer', label: 'Customer' },
  ];

  ngOnInit(): void {
    if (this.authStore.authenticated()) {
      void this.router.navigateByUrl(
        this.authStore.isOrganizer() && !this.authStore.isAdmin() ? '/organizer/management/events' : '/inicio',
      );
    }
  }

  protected login(): void {
    this.authStore.login();
  }

  protected loginWithMockCredentials(credentials: MockCredential): void {
    if (this.authStore.loginMock(credentials.email, credentials.password)) {
      void this.router.navigateByUrl(
        this.authStore.isOrganizer() && !this.authStore.isAdmin() ? '/organizer/management/events' : '/inicio',
      );
    }
  }
}
