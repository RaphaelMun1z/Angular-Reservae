import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

export const keycloak = new Keycloak({
  url: environment.auth.keycloakUrl,
  realm: environment.auth.realm,
  clientId: environment.auth.clientId,
});

export const keycloakInitOptions = {
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  checkLoginIframe: false,
  silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
} as const;

export const RESERVAE_API_AUDIENCE = 'reservae-api';
export const RESERVAE_FUNCTIONAL_ROLES = ['CUSTOMER', 'ADMIN'] as const;
