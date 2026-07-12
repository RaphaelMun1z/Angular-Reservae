export const environment = {
  production: false,
  apiGatewayUrl: 'http://localhost:8765',
  auth: {
    useMock: true,
    mockUser: {
      userId: 'SUBSTITUIR_POR_UUID_VALIDO_DO_BACKEND',
      username: 'Raphael Muniz',
      email: 'raphaelmunizvarela@hotmail.com',
      roles: ['USER'],
    },
  },
} as const;
