# Placement Preparation Tracker

A web platform where students prepare for campus placements in one place: timed aptitude exams, coding problems with automatic judging, live mock interviews and group discussions over video, and an ML-generated **Placement Readiness Score** that shows where they stand and what to improve.

Final year team project, <college name>, batch of 2026.

## Team

| #   | Name   | Role                    | Owns                                   |
| --- | ------ | ----------------------- | -------------------------------------- |
| P1  | <name> | Frontend lead           | `frontend/`                            |
| P2  | <name> | Core backend A          | `core-service/` (auth, users, content) |
| P3  | <name> | Core backend B          | `core-service/` (exams, coding)        |
| P4  | <name> | Realtime lead           | `realtime-service/`                    |
| P5  | <name> | ML and integration lead | `ml-service/`, Docker, Nginx, CI       |

## Architecture

```
                  React frontend
                        |
                Nginx (API gateway)
        ________________|________________________
       |                |                        |
 Spring Boot        Node.js                 FastAPI (ML)
 Core Service       Realtime Service        /predict
       |                |
  PostgreSQL          Redis          Judge0 (code runner)
```

## Repository structure

| Folder              | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `frontend/`         | React web app                                        |
| `core-service/`     | Spring Boot: auth, exams, coding, sessions, scores   |
| `realtime-service/` | Node.js: WebRTC signalling, chat, live notifications |
| `ml-service/`       | FastAPI: readiness score model and explainability    |
| `nginx/`            | Gateway configuration                                |
| `docs/`             | Contracts, API docs, diagrams, wireframes            |

## Tech stack

- **Frontend:** React, React Router, Tailwind CSS
- **Core:** Java, Spring Boot, Spring Security (JWT), PostgreSQL, Flyway
- **Realtime:** Node.js, Express, Socket.IO, WebRTC, Redis
- **ML:** Python, FastAPI, scikit-learn
- **Code execution:** Judge0
- **DevOps:** Docker, Docker Compose, GitHub Actions

## Getting started

## Run everything

1. Install Docker Desktop
2. `cp .env.example .env`
3. `docker compose up --build`
4. Open http://localhost

| URL                          | What                |
| ---------------------------- | ------------------- |
| http://localhost             | App (through Nginx) |
| http://localhost/api/health  | Core service        |
| http://localhost:4000/health | Realtime service    |
| http://localhost:8000/health | ML service          |

Stop: `docker compose down`. Stop and wipe the database: `docker compose down -v`.

## Branching and workflow

- `main`: always working, protected, changes only through pull requests.
- `develop`: integration branch.
- `feature/<module>-<name>`: one branch per piece of work, for example `feature/auth-login`.
- Every pull request needs one reviewer's approval.
- Commit messages are short and descriptive.

## Documentation

- API contracts and JWT rules: [`docs/contracts.md`](docs/contracts.md)
- Product requirements: <link to PRD>

## Status

Phase 0: planning and setup.
