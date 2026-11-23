import type { FieldDetail } from './types';

/** Turns the API's `details` array into { fieldName: message } for the forms. */
export function toFieldErrors(details: FieldDetail[]): Record<string, string> {
  return Object.fromEntries(details.map((d) => [d.field, d.message]));
}