import { loadSession } from '../auth/storage';
import type { ApiErrorBody, FieldDetail } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly details: FieldDetail[];

  constructor(status: number, message: string, details: FieldDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** The auth provider registers itself here so a rejected token signs the user out. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach the stored token. Set to false for public endpoints such as login. */
  auth?: boolean;
}

function fallbackMessage(status: number): string {
  if (status === 502 || status === 503 || status === 504) {
    return 'The service is temporarily unavailable. Please try again.';
  }
  if (status >= 500) {
    return 'Something went wrong on our side. Please try again.';
  }
  return 'The request failed.';
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    return new ApiError(
      response.status,
      body.message ?? fallbackMessage(response.status),
      body.details ?? [],
    );
  } catch {
    return new ApiError(response.status, fallbackMessage(response.status));
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = auth ? loadSession()?.token : undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T;
  }

  const error = await toApiError(response);
  // A 401 only means "your session is dead" if we actually sent a token.
  // A wrong password on the login form is also a 401 and must not sign anyone out.
  if (response.status === 401 && token) {
    unauthorizedHandler?.();
  }
  throw error;
}