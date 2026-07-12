import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TicketDetails } from './ticket-details';

import { TicketStore } from '../my-tickets/state/ticket.store';
describe('TicketDetails', () => {
  let component: TicketDetails;
  let fixture: ComponentFixture<TicketDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetails],
      providers: [provideRouter([]), TicketStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose an error when ticketId is absent', () => {
    component.ngOnInit();

    expect(component.store.error()).toContain('Ingresso nao identificado');
  });
});
