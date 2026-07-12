import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Shows } from './shows';

import { EventStore } from '../events/state/event.store';
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
});
