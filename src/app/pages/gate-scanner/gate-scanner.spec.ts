import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GateScanner } from './gate-scanner';

import { ScannerStore } from './state/scanner.store';
describe('GateScanner', () => {
  let component: GateScanner;
  let fixture: ComponentFixture<GateScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateScanner],
      providers: [provideRouter([]), ScannerStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GateScanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject an empty manual code', () => {
    component.validateManualCode();

    expect(component.store.error()).toContain('codigo de validacao');
  });

  it('should surface missing gateId for manual validation', () => {
    component.qrCodeHash.set('hash-1');
    component.store.setGateId(null);

    component.validateManualCode();

    expect(component.store.error()).toContain('Portao');
  });
});
