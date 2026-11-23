import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { seedSession } from '../test/helpers';
import { renderAt } from '../test/render';
import { RequireAuth } from './RequireAuth';

const tree = (
  <Routes>
    <Route path="/login" element={<div>login screen</div>} />
    <Route path="/forbidden" element={<div>forbidden screen</div>} />
    <Route element={<RequireAuth roles={['ADMIN']} />}>
      <Route path="/admin" element={<div>admin area</div>} />
    </Route>
  </Routes>
);

describe('RequireAuth', () => {
  it('sends anonymous visitors to the login page', () => {
    renderAt(tree, '/admin');
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('sends a signed-in user with the wrong role to the forbidden page', () => {
    seedSession('STUDENT');
    renderAt(tree, '/admin');
    expect(screen.getByText('forbidden screen')).toBeInTheDocument();
  });

  it('lets a user with the right role in', () => {
    seedSession('ADMIN');
    renderAt(tree, '/admin');
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});