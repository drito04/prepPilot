import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../auth/AuthProvider';

type Entry = string | { pathname: string; state?: unknown };

export function renderAt(ui: ReactElement, entry: Entry = '/') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}