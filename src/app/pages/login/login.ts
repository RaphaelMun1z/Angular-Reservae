import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authStore.authenticated()) {
      void this.router.navigateByUrl('/inicio');
    }
  }

  protected login(): void {
    this.authStore.login();
  }
}
