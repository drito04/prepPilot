export const PASSWORD_HINT = 'At least 8 characters, with a letter and a digit.';

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 72) {
    return 'Must be between 8 and 72 characters.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Must contain at least one letter and one digit.';
  }
  return null;
}