import { describe, expect, it } from 'vitest';
import type { Role } from '../api/types';
import { homePathFor, navFor } from './roles';

describe('homePathFor', () => {
  it.each<[Role, string]>([
    ['STUDENT', '/student'],
    ['INTERVIEWER', '/interviewer'],
    ['ADMIN', '/admin'],
  ])('maps %s to %s', (role, path) => {
    expect(homePathFor(role)).toBe(path);
  });
});

describe('navFor', () => {
  it('gives students a dashboard and a profile link', () => {
    expect(navFor('STUDENT').map((item) => item.to)).toEqual(['/student', '/student/profile']);
  });
});