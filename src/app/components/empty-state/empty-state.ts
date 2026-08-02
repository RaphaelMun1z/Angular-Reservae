import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionLink: string | readonly string[] | null = null;
  @Input() icon = '';
  @Output() readonly action = new EventEmitter<void>();
}
