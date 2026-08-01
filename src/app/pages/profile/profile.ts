import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, SiteNavbar, SiteFooter],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly authStore = inject(AuthStore);
  protected readonly fullName = signal('');
  protected readonly document = signal('');
  protected readonly editing = signal(false);
  protected readonly saved = signal(false);
  protected readonly profile = this.authStore.profile;
  protected readonly displayName = this.authStore.displayName;
  protected readonly email = computed(() => this.authStore.email() ?? 'E-mail nao informado');

  constructor() {
    const profile = this.profile();
    this.fullName.set(profile?.fullName ?? this.authStore.fullName() ?? '');
    this.formatDocument(profile?.document ?? '');
  }

  protected saveProfile(): void {
    this.saved.set(false);

    this.authStore
      .updateMyProfile({
        fullName: this.fullName().trim(),
        document: this.document().replace(/\D/g, '') || null,
      })
      .subscribe((profile) => {
        if (!profile) {
          this.editing.set(false);
          return;
        }

        this.fullName.set(profile.fullName ?? '');
        this.formatDocument(profile.document ?? '');
        this.editing.set(false);
        this.saved.set(true);
      });
  }

  protected toggleEditing(): void {
    this.editing.update((editing) => !editing);
  }

  protected formatDocument(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    const formatted = digits.length <= 11
      ? digits
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      : digits
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

    this.document.set(formatted);
  }
}
