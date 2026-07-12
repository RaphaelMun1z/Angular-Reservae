import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SectorSelection } from './sector-selection';

import { CheckoutStore } from '../checkout/state/checkout.store';
import { EventStore } from '../events/state/event.store';
describe('SectorSelection', () => {
  let component: SectorSelection;
  let fixture: ComponentFixture<SectorSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorSelection],
      providers: [provideRouter([]), CheckoutStore, EventStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectorSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not select a quantity below one', () => {
    const sector = { id: 'sector-1', name: 'Pista', basePrice: 100, halfPrice: 50, availableQuantity: 3 };

    component.setQuantity(sector, 0);

    expect(component.quantity('sector-1')).toBe(1);
  });

  it('should not select a quantity above known availability', () => {
    const sector = { id: 'sector-1', name: 'Pista', basePrice: 100, halfPrice: 50, availableQuantity: 2 };

    component.setQuantity(sector, 5);

    expect(component.quantity('sector-1')).toBe(2);
  });

  it('should add selected sector to checkout store', () => {
    const checkoutStore = TestBed.inject(CheckoutStore);
    const sector = { id: 'sector-1', name: 'Pista', basePrice: 100, halfPrice: 50, availableQuantity: 5 };

    component.setTicketType('sector-1', 'HALF_TICKET_PRICE');
    component.setQuantity(sector, 2);
    component.addSector(sector);

    expect(checkoutStore.items()).toEqual([
      {
        sectorId: 'sector-1',
        sectorName: 'Pista',
        quantity: 2,
        ticketType: 'HALF_TICKET_PRICE',
        unitPrice: 50,
      },
    ]);
  });
});
