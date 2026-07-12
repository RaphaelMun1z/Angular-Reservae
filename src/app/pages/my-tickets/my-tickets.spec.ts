import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MyTickets } from './my-tickets';

import { TicketStore } from './state/ticket.store';
describe('MyTickets', () => {
  let component: MyTickets;
  let fixture: ComponentFixture<MyTickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTickets],
      providers: [provideRouter([]), TicketStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
