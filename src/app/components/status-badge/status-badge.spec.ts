import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('renders friendly order labels and success tone', () => {
    fixture.componentRef.setInput('status', 'CONFIRMED');
    fixture.componentRef.setInput('context', 'order');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Pedido confirmado');
    expect(badge.classList.contains('is-success')).toBe(true);
  });

  it('renders ticket labels and a neutral tone for unknown statuses', () => {
    fixture.componentRef.setInput('status', 'UNKNOWN');
    fixture.componentRef.setInput('context', 'ticket');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('UNKNOWN');
    expect(badge.classList.contains('is-neutral')).toBe(true);
  });
});
