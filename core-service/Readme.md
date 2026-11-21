# prepPilot Core Service

Spring Boot service that owns users, authentication (email + one-time code), roles,
student profiles and admin user management. It is the only service that issues JWTs.

**Stack:** Java 21, Spring Boot 4, Spring Security (stateless JWT), Spring Data JPA,
PostgreSQL, Flyway, JJWT, Spring Mail, springdoc-openapi.

## Run it

### Whole stack with Docker Compose

```
cp .env.example .env      # then fill in the values
docker compose up --build
```

### From your IDE

1. `docker compose up -d postgres redis mailpit`
2. Set the environment variables below in your run configuration, with
   `DB_URL=jdbc:postgresql://localhost:5432/<dbname>` and `MAIL_HOST=localhost`.
3. Run the application class.

Inside Docker the database host is `postgres` and the mail host is `mailpit`.
From the IDE both are `localhost`.

Dev inbox (Mailpit): http://localhost:8025 — every email the app sends appears here.
Swagger UI: http://localhost:8080/swagger-ui.html — OpenAPI JSON: http://localhost:8080/v3/api-docs

## Environment variables

| Variable                                              | Required   | Default / example                                 | Notes                                                                        |
| ----------------------------------------------------- | ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `DB_URL`                                              | yes        | `jdbc:postgresql://localhost:5432/<dbname>`       |                                                                              |
| `DB_USER`, `DB_PASSWORD`                              | yes        |                                                   |                                                                              |
| `JWT_SECRET`                                          | yes        | 32+ characters                                    | Same value in the realtime service. Used as raw UTF-8, never base64-decoded. |
| `JWT_EXPIRY_SECONDS`                                  | no         | `7200`                                            |                                                                              |
| `FRONTEND_ORIGIN`                                     | no         | `http://localhost:5173`                           | CORS origin                                                                  |
| `MAIL_HOST`, `MAIL_PORT`                              | no         | `localhost`, `1025`                               | `mailpit` inside Docker                                                      |
| `MAIL_USERNAME`, `MAIL_PASSWORD`                      | no         | empty                                             | For a real SMTP provider                                                     |
| `MAIL_FROM`                                           | no         | `no-reply@preppilot.local`                        | Must be a verified sender on real providers                                  |
| `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS`                | no         | `false`                                           | `true` for real providers                                                    |
| `OTP_TTL_MINUTES`                                     | no         | `10`                                              |                                                                              |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`             | no         | empty                                             | Both set = admin account created at startup                                  |
| `SEED_INTERVIEWER_EMAIL`, `SEED_INTERVIEWER_PASSWORD` | no         | empty                                             | Same, for an interviewer                                                     |
| `SWAGGER_ENABLED`                                     | no         | `true`                                            | `false` turns off Swagger and api-docs                                       |
| `TEST_DB_URL`                                         | tests only | `jdbc:postgresql://localhost:5432/preppilot_test` |                                                                              |

## Endpoints

| Method   | Path                            | Who                | Purpose                                               |
| -------- | ------------------------------- | ------------------ | ----------------------------------------------------- |
| POST     | `/api/auth/register`            | public             | Create an unverified student and email a code         |
| POST     | `/api/auth/verify-email`        | public             | Check the code; returns a token like login            |
| POST     | `/api/auth/resend-verification` | public             | Send a new code                                       |
| POST     | `/api/auth/login`               | public             | Returns a token (403 if the email is unverified)      |
| POST     | `/api/auth/forgot-password`     | public             | Email a reset code (same response for unknown emails) |
| POST     | `/api/auth/reset-password`      | public             | Code plus new password                                |
| GET      | `/api/me`                       | any logged-in user | Current user                                          |
| GET, PUT | `/api/me/profile`               | STUDENT            | Own profile                                           |
| POST     | `/api/admin/users`              | ADMIN              | Create a user with any role                           |

## Tokens

HS256 JWT with claims `sub` (user UUID), `role` (`STUDENT`, `INTERVIEWER`, `ADMIN`), `iat`, `exp`.
Sent as `Authorization: Bearer <token>`. Full contract: `docs/jwt-contract.md`.

## Errors

Every error has this shape (see `docs/api-conventions.md`):

```json
{
  "timestamp": "...",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "path": "/api/auth/register",
  "details": [{ "field": "email", "message": "must be a valid email" }]
}
```

`details` appears only for validation errors.

## Database and Flyway

- Flyway runs the files in `src/main/resources/db/migration` at startup.
- Never edit a migration after it is merged. Add a new numbered file instead.
- Hibernate only validates (`ddl-auto: validate`). Flyway is the only thing that changes the schema.
- Local database out of sync? `docker compose down -v`, then start again.

## Tests

```
docker compose exec postgres psql -U <DB_USER> -d postgres -c "CREATE DATABASE preppilot_test;"   # once
mvn test
```

Set `DB_USER` and `DB_PASSWORD` first. Tests use the `preppilot_test` database and
refuse to run against anything else. The mail sender is mocked.

## Package layout

`config` (security, CORS, OpenAPI, seeder) · `controller` · `dto` · `exception`
· `model` · `repository` · `security` (JWT) · `service`
