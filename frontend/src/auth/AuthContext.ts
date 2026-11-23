import { createContext } from 'react';
import type { LoginResponse, User } from '../api/types';

export interface AuthContextValue {
  user: User | null;
  /** Takes the login response so the verify-email step can reuse it. */
  signIn: (response: LoginResponse) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);