import { TestBed } from '@angular/core/testing';
import { MockAuthIntegration } from './mock-auth.integration';

describe('MockAuthIntegration', () => {
  let integration: MockAuthIntegration;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockAuthIntegration],
    });

    integration = TestBed.inject(MockAuthIntegration);
  });

  it('should initialize with the configured mock user', () => {
    integration.currentSession().subscribe((session) => {
      expect(session.authenticated).toBe(true);
      expect(session.userId).toBe('SUBSTITUIR_POR_UUID_VALIDO_DO_BACKEND');
      expect(session.username).toBe('Raphael Muniz');
      expect(session.email).toBe('raphaelmunizvarela@hotmail.com');
      expect(session.roles).toEqual(['USER']);
    });
  });

  it('should return the mock user on login', () => {
    integration.login().subscribe((session) => {
      expect(session.authenticated).toBe(true);
      expect(session.username).toBe('Raphael Muniz');
    });
  });

  it('should clear the mock session on logout', () => {
    integration.logout().subscribe(() => {
      integration.currentSession().subscribe((session) => {
        expect(session.authenticated).toBe(false);
        expect(session.userId).toBeNull();
        expect(session.roles).toEqual([]);
      });
    });
  });
});
