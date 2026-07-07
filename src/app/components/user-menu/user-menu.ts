import { Component, HostListener, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {
  @Input() name = 'Usuário Reservaê';
  @Input() email = 'usuario@reservae.com';
  @Input() avatarUrl = '';

  protected readonly isOpen = signal(false);

  protected get initials(): string {
    return this.name
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

  @HostListener('document:click')
  protected closeOnOutsideClick(): void {
    this.close();
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.close();
  }
}
