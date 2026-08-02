import { Component, Input } from '@angular/core';
import { orderStatusLabel, ticketStatusLabel } from '../../presentation/presentation-labels';

type StatusContext = 'order' | 'ticket';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: '<span class="status-badge" [class]="toneClass()" role="status">{{ label() }}</span>',
  styleUrl: './status-badge.scss',
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: string | null | undefined;
  @Input() context: StatusContext = 'order';

  protected label(): string {
    return this.context === 'ticket' ? ticketStatusLabel(this.status) : orderStatusLabel(this.status);
  }

  protected toneClass(): string {
    switch (this.status) {
      case 'CONFIRMED':
      case 'PAID':
      case 'APPROVED':
      case 'PAYMENT_APPROVED':
      case 'VALID':
        return 'is-success';
      case 'PENDING':
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
      case 'PROCESSING':
      case 'USED':
        return 'is-warning';
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
      case 'RESERVATION_FAILED':
      case 'FAILED':
      case 'REVOKED':
        return 'is-danger';
      default:
        return 'is-neutral';
    }
  }
}
