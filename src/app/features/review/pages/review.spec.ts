import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Review } from './review';

import { CheckoutStore } from '../../checkout/state/checkout.store';
describe('Review', () => {
  let component: Review;
  let fixture: ComponentFixture<Review>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Review],
      providers: [provideRouter([]), CheckoutStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Review);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable and submit the review after selecting a rating', () => {
    const ratingButton = fixture.nativeElement.querySelector('[aria-label="Avaliar com 5 estrelas"]') as HTMLButtonElement;
    const submitButton = fixture.nativeElement.querySelector('#btn-submit-feedback') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
    ratingButton.click();
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
    submitButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#evaluation-card').classList.contains('hidden')).toBe(true);
    expect(fixture.nativeElement.querySelector('#evaluation-success').classList.contains('hidden')).toBe(false);
  });
});
