import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TicketTransfer } from './ticket-transfer';

import { TicketStore } from '../my-tickets/state/ticket.store';
describe('TicketTransfer', () => {
  let component: TicketTransfer;
  let fixture: ComponentFixture<TicketTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketTransfer],
      providers: [provideRouter([]), TicketStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketTransfer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
