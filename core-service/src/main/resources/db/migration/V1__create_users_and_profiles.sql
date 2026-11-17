CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_users (
                       id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email         VARCHAR(255) NOT NULL,
                       password_hash VARCHAR(100) NOT NULL,
                       full_name     VARCHAR(120) NOT NULL,
                       role          VARCHAR(20)  NOT NULL
                           CHECK (role IN ('STUDENT', 'INTERVIEWER', 'ADMIN')),
                       enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
                       created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
                       updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email ON app_users (lower(email));

CREATE TABLE student_profiles (
                                  user_id             UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
                                  branch              VARCHAR(80),
                                  graduation_year     INTEGER,
                                  cgpa                NUMERIC(4,2) CHECK (cgpa >= 0 AND cgpa <= 10),
                                  target_company_type VARCHAR(30),
                                  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);