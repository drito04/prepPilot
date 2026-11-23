import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, seedSession } from '../test/helpers';
import { ApiError, request, setUnauthorizedHandler } from './client';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  setUnauthorizedHandler(null);
});

function lastRequestHeaders(): Record<string, string> {
  return (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
}

describe('request', () => {
  it('attaches the stored token to authenticated requests', async () => {
    seedSession();
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    await request('/api/me');
    expect(lastRequestHeaders().Authorization).toBe('Bearer test-token');
  });

  it('sends no token when auth is false', async () => {
    seedSession();
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    await request('/api/auth/login', { method: 'POST', body: {}, auth: false });
    expect(lastRequestHeaders().Authorization).toBeUndefined();
  });

  it('sends a JSON body with the right content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    await request('/api/x', { method: 'POST', body: { a: 1 }, auth: false });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect(lastRequestHeaders()['Content-Type']).toBe('application/json');
  });

  it('maps the agreed error shape to an ApiError with field details', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        timestamp: 't',
        status: 400,
        error: 'BAD_REQUEST',
        message: 'Validation failed',
        path: '/api/auth/register',
        details: [{ field: 'email', message: 'must be a valid email' }],
      }),
    );
    const error = await request('/api/auth/register', { method: 'POST', body: {}, auth: false }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: [{ field: 'email', message: 'must be a valid email' }],
    });
  });

  it('uses the gateway message for a simple 502 body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(502, { status: 502, error: 'BAD_GATEWAY', message: 'Service temporarily unavailable' }),
    );
    const error = await request('/api/me').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, message: 'Service temporarily unavailable' });
  });

  it('falls back to a friendly message for a non-JSON 502', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));
    const error = await request('/api/me').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toContain('temporarily unavailable');
  });

  it('reports a network failure as status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await request('/api/me').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 0 });
  });

  it('calls the unauthorized handler when a sent token is rejected', async () => {
    seedSession();
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(jsonResponse(401, { status: 401, message: 'Invalid token' }));
    await request('/api/me').catch(() => undefined);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call it for a 401 without a token, such as a wrong password', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(jsonResponse(401, { status: 401, message: 'Invalid email or password' }));
    await request('/api/auth/login', { method: 'POST', body: {}, auth: false }).catch(() => undefined);
    expect(handler).not.toHaveBeenCalled();
  });
});