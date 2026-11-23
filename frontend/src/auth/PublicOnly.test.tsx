import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { seedSession } from '../test/helpers';
import { renderAt } from '../test/render';
import { PublicOnly } from './PublicOnly';

const tree = (
  <Routes>
    <Route element={<PublicOnly />}>
      <Route path="/register" element={<div>register form</div>} />
    </Route>
    <Route path="/student" element={<div>student home</div>} />
    <Route path="/admin" element={<div>admin home</div>} />
  </Routes>
);

describe('PublicOnly', () => {
  it('shows public pages to anonymous visitors', () => {
    renderAt(tree, '/register');
    expect(screen.getByText('register form')).toBeInTheDocument();
  });

  it('sends a signed-in user to their own home page', () => {
    seedSession('ADMIN');
    renderAt(tree, '/register');
    expect(screen.getByText('admin home')).toBeInTheDocument();
  });
});