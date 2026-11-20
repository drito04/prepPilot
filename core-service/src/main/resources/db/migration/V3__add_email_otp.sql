-- Existing accounts (including seeded and test users) count as verified.
ALTER TABLE app_users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE;
-- From now on a new row is unverified unless the code says otherwise.
ALTER TABLE app_users ALTER COLUMN email_verified SET DEFAULT FALSE;

CREATE TABLE otp_codes (
                           id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           user_id     UUID         NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
                           purpose     VARCHAR(30)  NOT NULL
                               CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
                           code_hash   VARCHAR(100) NOT NULL,
                           expires_at  TIMESTAMPTZ  NOT NULL,
                           attempts    INTEGER      NOT NULL DEFAULT 0,
                           consumed_at TIMESTAMPTZ,
                           created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_user_purpose_created
    ON otp_codes (user_id, purpose, created_at DESC);