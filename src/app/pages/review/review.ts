import { Component, inject } from '@angular/core';
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
}
