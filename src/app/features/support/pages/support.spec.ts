import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Support } from './support';

describe('Support', () => {
  let component: Support;
  let fixture: ComponentFixture<Support>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Support],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Support);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
