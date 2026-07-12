import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  Gauge,
  Handshake,
  LogOut,
  Mail,
  Menu,
  Percent,
  QrCode,
  Receipt,
  Save,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  UserCircle,
  Users,
  X,
  LUCIDE_ICONS,
  LucideIconProvider,
} from 'lucide-angular';

import { Settings } from './settings';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let router: Router;
  let isMobile = false;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: isMobile && query.includes('max-width: 767px'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([
          { path: 'configuracoes', component: Settings },
          { path: 'dashboard', component: Settings },
          { path: 'eventos', component: Settings },
          { path: 'scanner', component: Settings },
          { path: 'perfil', component: Settings },
        ]),
        {
          provide: LUCIDE_ICONS,
          multi: true,
          useValue: new LucideIconProvider({
            Bell,
            CalendarDays,
            ChartNoAxesCombined,
            CreditCard,
            Gauge,
            Handshake,
            LogOut,
            Mail,
            Menu,
            Percent,
            QrCode,
            Receipt,
            Save,
            Search,
            Settings: SettingsIcon,
            ShieldCheck,
            SlidersHorizontal,
            Ticket,
            UserCircle,
            Users,
            X,
          }),
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    await router.navigateByUrl('/configuracoes');

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    document.body.classList.remove('admin-menu-open');
    isMobile = false;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the admin shell without the old top-level layout gap classes', () => {
    const layout = fixture.debugElement.query(By.css('.admin-layout'));
    const main = fixture.debugElement.query(By.css('.admin-main'));
    const oldMain = fixture.nativeElement.querySelector('main.h-screen');

    expect(layout).toBeTruthy();
    expect(main).toBeTruthy();
    expect(oldMain).toBeNull();
  });

  it('renders sidebar descriptions and marks configuracoes active', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const descriptions = Array.from(
      fixture.nativeElement.querySelectorAll('.nav-description'),
    ).map((item) => (item as HTMLElement).textContent?.trim());
    const activeItem = fixture.nativeElement.querySelector('.admin-nav-item.active');

    expect(descriptions).toContain('Ajuste parametros do sistema');
    expect(descriptions).toContain('Visao geral da plataforma');
    expect(activeItem?.textContent).toContain('Configuracoes');
  });

  it('collapses and expands the sidebar on desktop through the hamburger button', () => {
    const host = fixture.nativeElement as HTMLElement;
    const button = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;

    expect(host.classList.contains('sidebar-collapsed')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    fixture.detectChanges();

    expect(host.classList.contains('sidebar-collapsed')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();

    expect(host.classList.contains('sidebar-collapsed')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens mobile sidebar, closes by backdrop, and toggles aria-expanded', () => {
    isMobile = true;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(host.classList.contains('mobile-sidebar-open')).toBe(true);
    expect(document.body.classList.contains('admin-menu-open')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop') as HTMLButtonElement;
    backdrop.click();
    fixture.detectChanges();

    expect(host.classList.contains('mobile-sidebar-open')).toBe(false);
    expect(document.body.classList.contains('admin-menu-open')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes mobile sidebar with Escape and after navigation click', () => {
    isMobile = true;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(host.classList.contains('mobile-sidebar-open')).toBe(false);

    button.click();
    fixture.detectChanges();

    const navItem = fixture.nativeElement.querySelector('.admin-nav-item') as HTMLAnchorElement;
    navItem.click();
    fixture.detectChanges();

    expect(host.classList.contains('mobile-sidebar-open')).toBe(false);
  });
});

