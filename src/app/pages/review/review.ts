import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckoutStore } from '../checkout/state/checkout.store';

@Component({
  selector: 'app-review',
  imports: [RouterLink],
  templateUrl: './review.html',
  styleUrl: './review.scss',
})
export class Review {
  readonly store = inject(CheckoutStore);
  protected readonly selectedRating = signal(0);
  protected readonly comment = signal('');
  protected readonly submitted = signal(false);

  protected selectRating(rating: number): void {
    this.selectedRating.set(rating);
  }

  protected updateComment(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  protected submitFeedback(): void {
    if (this.selectedRating() > 0) {
      this.submitted.set(true);
    }
  }
}
