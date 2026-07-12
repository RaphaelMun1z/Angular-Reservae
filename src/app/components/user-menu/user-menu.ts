import { Component, computed, HostListener, inject, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {
  private readonly authStore = inject(AuthStore);

  @Input() name: string | null = null;
  @Input() email: string | null = null;
  @Input() avatarUrl = '';

  protected readonly isOpen = signal(false);
  protected readonly displayName = computed(() => this.name || this.authStore.username() || 'Sessao nao autenticada');
  protected readonly displayEmail = computed(() => this.email || this.authStore.email() || 'Entre para acessar sua conta');

  protected get initials(): string {
    return this.displayName()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((isOpen) => !isOpen);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected logout(): void {
    this.authStore.logout();
    this.close();
  }

  @HostListener('document:click')
  protected closeOnOutsideClick(): void {
    this.close();
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.close();
  }
}
