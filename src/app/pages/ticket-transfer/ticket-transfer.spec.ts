import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketTransfer } from './ticket-transfer';

describe('TicketTransfer', () => {
  let component: TicketTransfer;
  let fixture: ComponentFixture<TicketTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketTransfer]
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
