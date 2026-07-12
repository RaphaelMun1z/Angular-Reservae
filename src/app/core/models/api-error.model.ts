export interface ApiErrorResponse {
  readonly status?: number;
  readonly error?: string;
  readonly message?: string;
  readonly path?: string;
  readonly timestamp?: string;
}
