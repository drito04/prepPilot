import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { seedSession } from '../test/helpers';
import { renderAt } from '../test/render';
import { Layout } from './Layout';

const tree = (
  <Routes>
    <Route path="/login" element={<div>login screen</div>} />
    <Route element={<Layout />}>
      <Route path="/student" element={<div>student dashboard</div>} />
      <Route path="/student/profile" element={<div>profile page</div>} />
      <Route path="/admin" element={<div>admin dashboard</div>} />
    </Route>
  </Routes>
);

describe('Layout', () => {
  it('shows the student navigation links', () => {
    seedSession('STUDENT');
    renderAt(tree, '/student');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/student');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/student/profile');
  });

  it('shows only the dashboard link to an admin', () => {
    seedSession('ADMIN');
    renderAt(tree, '/admin');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
  });

  it('marks only the current page as active', () => {
    seedSession('STUDENT');
    renderAt(tree, '/student/profile');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('logs out and returns to the login page', async () => {
    seedSession('STUDENT');
    const user = userEvent.setup();
    renderAt(tree, '/student');
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByText('login screen')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });
});