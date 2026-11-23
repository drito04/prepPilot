import type { LoginResponse, Role, User } from '../api/types';
import { saveSession } from '../auth/storage';
import type { Mock } from 'vitest';

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function makeUser(role: Role = 'STUDENT'): User {
  return {
    id: '3f2b8c1e-9d4a-4e6b-8f1a-2c7d5e9a0b34',
    email: 'user@test.com',
    fullName: 'Test User',
    role,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

export function makeLoginResponse(role: Role = 'STUDENT'): LoginResponse {
  return { accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 7200, user: makeUser(role) };
}

/** Puts a valid session in localStorage, as if the user had logged in earlier. */
export function seedSession(role: Role = 'STUDENT'): void {
  saveSession({ token: 'test-token', expiresAt: Date.now() + 3_600_000, user: makeUser(role) });
}

/** The JSON body of the n-th call made to a mocked fetch. */
export function sentJson(fetchMock: Mock, call = 0): unknown {
  return JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string);
}