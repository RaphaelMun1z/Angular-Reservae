import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, SiteNavbar, SiteFooter],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly authStore = inject(AuthStore);
  protected readonly fullName = signal('');
  protected readonly document = signal('');
  protected readonly saved = signal(false);
  protected readonly profile = this.authStore.profile;
  protected readonly displayName = this.authStore.displayName;
  protected readonly email = computed(() => this.authStore.email() ?? 'E-mail nao informado');

  constructor() {
    const profile = this.profile();
    this.fullName.set(profile?.fullName ?? this.authStore.fullName() ?? '');
    this.document.set(profile?.document ?? '');
  }

  protected saveProfile(): void {
    this.saved.set(false);

    this.authStore
      .updateMyProfile({
        fullName: this.fullName().trim(),
        document: this.document().trim() || null,
      })
      .subscribe((profile) => {
        if (!profile) {
          return;
        }

        this.fullName.set(profile.fullName ?? '');
        this.document.set(profile.document ?? '');
        this.saved.set(true);
      });
  }
}
