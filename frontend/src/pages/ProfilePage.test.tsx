import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '../api/profile';
import { jsonResponse, seedSession, sentJson } from '../test/helpers';
import { renderAt } from '../test/render';
import { ProfilePage } from './ProfilePage';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  seedSession('STUDENT');
});

const filled: Profile = {
  branch: 'CSE',
  graduationYear: 2026,
  cgpa: 8.5,
  targetCompanyType: 'PRODUCT',
  updatedAt: '2026-11-20T10:00:00Z',
};

const empty: Profile = {
  branch: null,
  graduationYear: null,
  cgpa: null,
  targetCompanyType: null,
  updatedAt: null,
};

async function openPage(profile: Profile) {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, profile));
  const user = userEvent.setup();
  renderAt(<ProfilePage />, '/student/profile');
  await screen.findByLabelText('Branch');
  return user;
}

describe('ProfilePage', () => {
  it('shows a loading state, then the saved values', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, filled));
    renderAt(<ProfilePage />, '/student/profile');
    expect(screen.getByRole('status')).toHaveTextContent('Loading your profile');

    expect(await screen.findByLabelText('Branch')).toHaveValue('CSE');
    expect(screen.getByLabelText('Graduation year')).toHaveValue('2026');
    expect(screen.getByLabelText('CGPA')).toHaveValue('8.5');
    expect(screen.getByLabelText('Target company type')).toHaveValue('PRODUCT');
    expect(screen.getByText(/Last saved/)).toBeInTheDocument();
  });

  it('shows an empty form for a student who has not saved a profile', async () => {
    await openPage(empty);
    expect(screen.getByText('Not saved yet.')).toBeInTheDocument();
    expect(screen.getByLabelText('Branch')).toHaveValue('');
    expect(screen.getByLabelText('CGPA')).toHaveValue('');
    expect(screen.getByLabelText('Target company type')).toHaveValue('');
  });

  it('saves changes and confirms', async () => {
    const user = await openPage(filled);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        branch: 'CSE',
        graduationYear: 2027,
        cgpa: 9.1,
        targetCompanyType: 'STARTUP',
        updatedAt: '2026-11-24T09:00:00Z',
      }),
    );

    await user.clear(screen.getByLabelText('Graduation year'));
    await user.type(screen.getByLabelText('Graduation year'), '2027');
    await user.clear(screen.getByLabelText('CGPA'));
    await user.type(screen.getByLabelText('CGPA'), '9.1');
    await user.selectOptions(screen.getByLabelText('Target company type'), 'STARTUP');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe('PUT');
    expect(sentJson(fetchMock, 1)).toEqual({
      branch: 'CSE',
      graduationYear: 2027,
      cgpa: 9.1,
      targetCompanyType: 'STARTUP',
    });
  });

  it('sends null for fields that were emptied', async () => {
    const user = await openPage(filled);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...empty, updatedAt: '2026-11-24T09:00:00Z' }));

    await user.clear(screen.getByLabelText('Branch'));
    await user.clear(screen.getByLabelText('Graduation year'));
    await user.clear(screen.getByLabelText('CGPA'));
    await user.selectOptions(screen.getByLabelText('Target company type'), '');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
    expect(sentJson(fetchMock, 1)).toEqual({
      branch: null,
      graduationYear: null,
      cgpa: null,
      targetCompanyType: null,
    });
  });

  it('does not call the API for a CGPA above 10', async () => {
    const user = await openPage(filled);
    await user.clear(screen.getByLabelText('CGPA'));
    await user.type(screen.getByLabelText('CGPA'), '11');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(
      await screen.findByText('Enter a number between 0 and 10 with up to 2 decimals.'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not call the API for a graduation year out of range', async () => {
    const user = await openPage(filled);
    await user.clear(screen.getByLabelText('Graduation year'));
    await user.type(screen.getByLabelText('Graduation year'), '1990');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(
      await screen.findByText('Enter a four-digit year between 2000 and 2100.'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows field errors returned by the server', async () => {
    const user = await openPage(filled);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        status: 400,
        message: 'Validation failed',
        details: [{ field: 'cgpa', message: 'must be between 0 and 10' }],
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('must be between 0 and 10')).toBeInTheDocument();
  });

  it('shows a load error and recovers with Try again', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(500, { status: 500, message: 'Unexpected server error' }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(200, filled));
    const user = userEvent.setup();
    renderAt(<ProfilePage />, '/student/profile');

    expect(await screen.findByRole('alert')).toHaveTextContent('Unexpected server error');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Branch')).toHaveValue('CSE');
  });

  it('hides the saved notice once the student edits a field again', async () => {
    const user = await openPage(filled);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, filled));
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Branch'), 'x');
    expect(screen.queryByText('Profile saved.')).not.toBeInTheDocument();
  });
});