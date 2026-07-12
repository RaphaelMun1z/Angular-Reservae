export const environment = {
  production: false,
  apiGatewayUrl: 'http://localhost:8765',
  auth: {
    useMock: false,
    keycloakUrl: 'http://localhost:8080',
    realm: 'reservae',
    clientId: 'reservae-web',
    mockUser: {
      userId: 'SUBSTITUIR_POR_UUID_VALIDO_DO_BACKEND',
      username: 'Raphael Muniz',
      email: 'raphaelmunizvarela@hotmail.com',
      roles: ['CUSTOMER'],
    },
  },
} as const;
