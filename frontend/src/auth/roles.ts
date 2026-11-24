import type { Role } from '../api/types';

export interface NavItem {
  to: string;
  label: string;
  /** Match the path exactly, so "Dashboard" is not highlighted on /student/profile. */
  end?: boolean;
}

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

export function navFor(role: Role): NavItem[] {
  switch (role) {
    case 'STUDENT':
      return [
        { to: '/student', label: 'Dashboard', end: true },
        { to: '/student/profile', label: 'Profile' },
      ];
    case 'INTERVIEWER':
      return [{ to: '/interviewer', label: 'Dashboard', end: true }];
    case 'ADMIN':
      return [{ to: '/admin', label: 'Dashboard', end: true }];
  }
}