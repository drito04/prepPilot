import type { Role } from '../api/types';

export function homePathFor(role: Role): string {
  switch (role) {
    case 'STUDENT':
      return '/student';
    case 'INTERVIEWER':
      return '/interviewer';
    case 'ADMIN':
      return '/admin';
  }
}