import { Component, Input } from '@angular/core';

type SkeletonVariant = 'cards' | 'list' | 'table' | 'hero' | 'detail';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.html',
  styleUrl: './skeleton-loader.scss',
})
export class SkeletonLoader {
  @Input() variant: SkeletonVariant = 'cards';
  @Input() count = 3;

  protected items(): readonly number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, index) => index);
  }
}
