import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/me', () =>
    HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
  ),
]
