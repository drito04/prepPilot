export type Role = 'STUDENT' | 'INTERVIEWER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // seconds
  user: User;
}

export interface FieldDetail {
  field: string;
  message: string;
}

// The error shape every service returns (docs/api-conventions.md).
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: FieldDetail[];
}