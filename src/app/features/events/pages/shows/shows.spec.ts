import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Shows } from './shows';

import { EventStore } from '../../state/event.store';
import { AuthStore } from '../../../../core/state/auth.store';
describe('Shows', () => {
  let component: Shows;
  let fixture: ComponentFixture<Shows>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shows],
      providers: [provideRouter([]), EventStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shows);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows an operational CTA and no purchase link for an organizer', () => {
    TestBed.inject(AuthStore).updateSession({ initialized: true, authenticated: true, userId: 'organizer-1', username: 'organizer', fullName: 'Organizer', email: null, roles: ['ORGANIZER'], profile: null });
    fixture.detectChanges();

    expect(component.organizerOnly()).toBe(true);
  });

  it('keeps the purchase CTA for a customer', () => {
    TestBed.inject(AuthStore).updateSession({ initialized: true, authenticated: true, userId: 'customer-1', username: 'customer', fullName: 'Customer', email: null, roles: ['CUSTOMER'], profile: null });
    fixture.detectChanges();

    expect(component.organizerOnly()).toBe(false);
  });
});
