export const environment = {
  production: true,
  apiGatewayUrl: 'http://localhost:8765',
  auth: {
    useMock: false,
    keycloakUrl: 'http://localhost:8080',
    realm: 'reservae',
    clientId: 'reservae-web',
    mockUser: {
      userId: '',
      username: '',
      email: '',
      roles: [],
    },
  },
} as const;
