# prepPilot Frontend

React + TypeScript single-page app (Vite, Tailwind CSS 4, React Router 7, Vitest).

## Run in development

Start the backend stack first (`docker compose up -d` from the repo root), then:

```
npm install
npm run dev     # http://localhost:5173
```

Vite proxies `/api` and `/socket.io` to the gateway at http://localhost:8088,
so the browser only ever sees one origin and there is no CORS to configure.

## Scripts

`npm test` · `npm run lint` · `npm run build` · `npm run preview`

## How auth works

- `src/api/client.ts` attaches the token, parses the standard error shape into `ApiError`
  and signs the user out when an authenticated call returns 401.
- `src/auth/` holds the session (localStorage), the provider, the `useAuth` hook and the
  route guards. The guards are for user experience only; the services enforce access.
- The app signs out automatically when the token expires (no refresh tokens in v1).

## In Docker

The `frontend` service serves the built files with Nginx. The `gateway` service routes
`/` to it, `/api` to core and `/socket.io` to realtime.
