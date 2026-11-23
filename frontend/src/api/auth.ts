import { request } from './client';
import type { LoginResponse, MessageResponse, User } from './types';

export function register(fullName: string, email: string, password: string): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/register', {
    method: 'POST',
    body: { fullName, email, password },
    auth: false,
  });
}

export function verifyEmail(email: string, otp: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: { email, otp },
    auth: false,
  });
}

export function resendVerification(email: string): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/resend-verification', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export function resetPassword(email: string, otp: string, newPassword: string): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: { email, otp, newPassword },
    auth: false,
  });
}

export function fetchMe(): Promise<User> {
  return request<User>('/api/me');
}