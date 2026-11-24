import { request } from './client';

// Must match the values core accepts for targetCompanyType.
export const TARGET_COMPANY_TYPES = [
  { value: 'SERVICE', label: 'Service-based company' },
  { value: 'PRODUCT', label: 'Product-based company' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'ANALYST', label: 'Analyst / consultant role' },
] as const;

export interface Profile {
  branch: string | null;
  graduationYear: number | null;
  cgpa: number | null;
  targetCompanyType: string | null;
  updatedAt: string | null;
}

export type ProfileInput = Omit<Profile, 'updatedAt'>;

export function getProfile(): Promise<Profile> {
  return request<Profile>('/api/me/profile');
}

/** Replaces the whole profile: a field sent as null is cleared. */
export function updateProfile(input: ProfileInput): Promise<Profile> {
  return request<Profile>('/api/me/profile', { method: 'PUT', body: input });
}