import { describe, expect, it } from 'vitest';
import { validatePassword } from './passwordRules';

describe('validatePassword', () => {
  it('accepts a valid password', () => {
    expect(validatePassword('Passw0rd!x')).toBeNull();
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(validatePassword('Ab1')).toBe('Must be between 8 and 72 characters.');
  });

  it('rejects a password longer than 72 characters', () => {
    expect(validatePassword('a1'.repeat(37))).toBe('Must be between 8 and 72 characters.');
  });

  it('rejects a password without a digit', () => {
    expect(validatePassword('Password!x')).toBe('Must contain at least one letter and one digit.');
  });

  it('rejects a password without a letter', () => {
    expect(validatePassword('12345678!')).toBe('Must contain at least one letter and one digit.');
  });
});