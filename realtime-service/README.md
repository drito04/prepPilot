# prepPilot Realtime Service

Node.js service for Socket.IO features. It verifies JWTs issued by the core service
(HS256, shared `JWT_SECRET`, used as raw UTF-8) and never issues tokens itself.

## Run

```
npm install
npm run dev        # needs .env, see below
npm test
```

## Environment

| Variable          | Default                  | Notes                               |
| ----------------- | ------------------------ | ----------------------------------- |
| `JWT_SECRET`      | none, required           | 32+ characters, identical to core's |
| `PORT`            | `4000`                   |                                     |
| `REDIS_URL`       | `redis://localhost:6379` | `redis://redis:6379` in Docker      |
| `FRONTEND_ORIGIN` | `http://localhost:5173`  | CORS for Socket.IO                  |

## Endpoints

- `GET /health`: status and Redis state
- Socket.IO at `/socket.io`: token in `auth.token` or the `Authorization` header; event `whoami`
- Diagnostic only, not routed by Nginx: `GET /whoami`, `GET /admin-ping`

## Check a token from core

```
node --env-file=.env scripts/check-token.js "<token>"
```
