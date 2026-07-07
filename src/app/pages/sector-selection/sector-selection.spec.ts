import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectorSelection } from './sector-selection';

describe('SectorSelection', () => {
  let component: SectorSelection;
  let fixture: ComponentFixture<SectorSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectorSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
