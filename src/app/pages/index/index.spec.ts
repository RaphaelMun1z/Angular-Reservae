import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Index } from './index';

import { EventStore } from '../events/state/event.store';
describe('Index', () => {
  let component: Index;
  let fixture: ComponentFixture<Index>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Index],
      providers: [provideRouter([]), EventStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Index);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
