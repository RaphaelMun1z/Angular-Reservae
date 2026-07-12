export type ReservaeRole = 'CUSTOMER' | 'ADMIN';

export interface UserProfile {
  readonly id: string | null;
  readonly fullName: string | null;
  readonly email: string | null;
  readonly document: string | null;
}

export interface UpdateUserProfileRequest {
  readonly fullName: string;
  readonly document: string | null;
}

export interface AuthSession {
  readonly initialized: boolean;
  readonly authenticated: boolean;
  readonly userId: string | null;
  readonly username: string | null;
  readonly fullName: string | null;
  readonly email: string | null;
  readonly roles: readonly ReservaeRole[];
  readonly profile: UserProfile | null;
}

