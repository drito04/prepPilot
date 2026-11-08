# Contracts

Last updated: Phase 0. Any change to this file needs a PR with approval from the owner of each affected service.

## 1. JWT

- Issued by: core-service only
- Verified by: core-service and realtime-service
- Algorithm: HS256
- Secret: env variable `JWT_SECRET`, at least 32 characters, plain text (not Base64). Same value in every service.
- Claims:
  - `sub`: user id (UUID string)
  - `role`: `STUDENT`, `INTERVIEWER` or `ADMIN`
  - `iat`: issued at (seconds)
  - `exp`: expiry (seconds)
- Expiry: 1 hour
- REST: header `Authorization: Bearer <token>`
- Socket.IO: `io(url, { auth: { token } })`

## 2. API conventions

- Browser calls everything through Nginx on one origin:
  - `/api/*` goes to core-service
  - `/socket.io/*` goes to realtime-service
  - ml-service is internal only and never exposed
- JSON field names: camelCase (`userId`, not `user_id`)
- IDs: UUID strings
- Dates and times: ISO-8601 in UTC, e.g. `2026-11-07T10:30:00Z`
- Error response (all services):
  ```json
  {
    "status": 400,
    "error": "VALIDATION_ERROR",
    "message": "Email is required",
    "timestamp": "2026-11-07T10:30:00Z"
  }
  ```
- Lists use `?page=0&size=20` and return:
  ```json
  { "items": [], "page": 0, "size": 20, "totalItems": 0 }
  ```
- Success responses return the object directly, no wrapper.

## 3. Service-to-service calls

| From     | To         | Endpoint                | Auth                                                    |
| -------- | ---------- | ----------------------- | ------------------------------------------------------- |
| core     | ml-service | `POST /predict`         | none, internal Docker network only                      |
| realtime | core       | `/internal/*` endpoints | header `X-Internal-Key` (value from `INTERNAL_API_KEY`) |
| core     | Judge0     | Judge0's own REST API   | none, internal Docker network only                      |

Why `X-Internal-Key` for realtime to core: system actions (for example, marking a session started) must work even when no user token is available. Endpoints under `/internal/*` are blocked at Nginx so browsers cannot reach them.

Rule: only core-service reads or writes PostgreSQL.

## 4. ML contract

### Request: `POST /predict`

```json
{
  "studentId": "3f2a9c1e-0000-0000-0000-000000000000",
  "features": {
    "aptitudeAccuracy": 0.72,
    "quantAccuracy": 0.65,
    "logicalAccuracy": 0.8,
    "verbalAccuracy": 0.7,
    "avgTimePerQuestionSec": 48.5,
    "codingProblemsSolved": 12,
    "codingAcceptanceRate": 0.55,
    "codingAvgDifficulty": 1.8,
    "interviewCommunication": 3.5,
    "interviewTechnical": 3.0,
    "interviewProblemSolving": 3.2,
    "interviewConfidence": 2.8,
    "examsAttempted": 5,
    "scoreConsistency": 0.85,
    "cgpa": 8.1
  }
}
```

| Field                                                                                    | Type           | Range       | Notes                                                      |
| ---------------------------------------------------------------------------------------- | -------------- | ----------- | ---------------------------------------------------------- |
| aptitudeAccuracy, quantAccuracy, logicalAccuracy, verbalAccuracy                         | number         | 0 to 1      | fraction, not percent                                      |
| avgTimePerQuestionSec                                                                    | number         | 0 and above | seconds                                                    |
| codingProblemsSolved                                                                     | integer        | 0 and above |                                                            |
| codingAcceptanceRate                                                                     | number         | 0 to 1      | accepted submissions / total submissions                   |
| codingAvgDifficulty                                                                      | number         | 1 to 3      | 1 easy, 2 medium, 3 hard                                   |
| interviewCommunication, interviewTechnical, interviewProblemSolving, interviewConfidence | number         | 1 to 5      | average of interviewer ratings, `null` if no interview yet |
| examsAttempted                                                                           | integer        | 0 and above |                                                            |
| scoreConsistency                                                                         | number         | 0 to 1      | 1 means very consistent scores                             |
| cgpa                                                                                     | number or null | 0 to 10     | optional                                                   |

### Response: success

```json
{
  "status": "OK",
  "score": 68.4,
  "category": "DEVELOPING",
  "modelVersion": "v1.0.0",
  "contributions": [
    { "feature": "aptitudeAccuracy", "impact": 8.1 },
    { "feature": "interviewConfidence", "impact": -5.2 }
  ]
}
```

- `score`: 0 to 100
- `category`: `NOT_READY` (below 40), `DEVELOPING` (40 to 69), `READY` (70 and above)
- `impact`: points added to or removed from the score, positive or negative

### Response: not enough data

Returned when `examsAttempted` is less than 2:

```json
{ "status": "INSUFFICIENT_DATA", "message": "At least 2 exams are required" }
```

### `GET /health`

```json
{ "status": "UP", "modelVersion": "v1.0.0" }
```

## 5. Realtime events (Socket.IO)

Auth: the JWT is checked on connection. Invalid token means the connection is rejected.

| Event           | Sent by | Received by              | Payload                                                                                              |
| --------------- | ------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `join-room`     | client  | server                   | `{ "roomCode": "string" }`                                                                           |
| `user-joined`   | server  | others in room           | `{ "userId": "string", "socketId": "string" }`                                                       |
| `offer`         | client  | server, then target peer | `{ "to": "socketId", "sdp": {} }`                                                                    |
| `answer`        | client  | server, then target peer | `{ "to": "socketId", "sdp": {} }`                                                                    |
| `ice-candidate` | client  | server, then target peer | `{ "to": "socketId", "candidate": {} }`                                                              |
| `chat-message`  | client  | server, then room        | `{ "roomCode": "string", "text": "string" }`                                                         |
| `leave-room`    | client  | server                   | `{ "roomCode": "string" }`                                                                           |
| `user-left`     | server  | others in room           | `{ "userId": "string", "socketId": "string" }`                                                       |
| `notification`  | server  | one user                 | `{ "id": "string", "type": "string", "title": "string", "body": "string", "createdAt": "ISO date" }` |

Rules:

- Only users invited to the session may join its room (the server checks with core).
- Maximum 2 participants for an interview room, 5 for a GD room (4 candidates plus 1 observer).
- Notification types: `EXAM_PUBLISHED`, `SESSION_SCHEDULED`, `SESSION_STARTING`, `RESULT_AVAILABLE`, `SCORE_UPDATED`.
