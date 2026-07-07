import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GateScanner } from './gate-scanner';

describe('GateScanner', () => {
  let component: GateScanner;
  let fixture: ComponentFixture<GateScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateScanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GateScanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
