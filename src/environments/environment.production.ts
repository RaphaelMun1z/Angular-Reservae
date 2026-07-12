export const environment = {
  production: true,
  apiGatewayUrl: 'http://localhost:8765',
  auth: {
    useMock: false,
    mockUser: {
      userId: '',
      username: '',
      email: '',
      roles: [],
    },
  },
} as const;
