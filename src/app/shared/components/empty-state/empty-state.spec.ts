import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyStateComponent } from './empty-state';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyStateComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
  });

  it('renders title, description and action', () => {
    fixture.componentRef.setInput('title', 'Nenhum pedido encontrado');
    fixture.componentRef.setInput('description', 'Crie uma compra para acompanhar o pedido.');
    fixture.componentRef.setInput('actionLabel', 'Ver eventos');
    fixture.componentRef.setInput('actionLink', '/shows');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nenhum pedido encontrado');
    expect(fixture.nativeElement.textContent).toContain('Crie uma compra');
    expect(fixture.nativeElement.querySelector('a')?.getAttribute('href')).toBe('/shows');
  });
});
