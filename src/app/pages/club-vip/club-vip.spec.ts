import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ClubVip } from './club-vip';

describe('ClubVip', () => {
  let component: ClubVip;
  let fixture: ComponentFixture<ClubVip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubVip],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubVip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
