import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  const body = error instanceof HttpErrorResponse ? error.error : error;
  const message = findMessage(body);
  return message ?? fallback;
}

function findMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const messages = value.map((item) => findMessage(item)).filter((item): item is string => Boolean(item));
    return messages.length ? messages.join(' ') : null;
  }
  if (!isRecord(value)) return null;
  for (const key of ['message', 'error', 'detail', 'title', 'errors']) {
    const message = findMessage(value[key]);
    if (message) return message;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
