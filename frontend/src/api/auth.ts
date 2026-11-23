import { request } from './client';
import type { LoginResponse, User } from './types';

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function fetchMe(): Promise<User> {
  return request<User>('/api/me');
}