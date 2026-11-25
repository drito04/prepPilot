CREATE TABLE topics (
                        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name        VARCHAR(100) NOT NULL,
                        category    VARCHAR(20)  NOT NULL
                            CHECK (category IN ('QUANT', 'LOGICAL', 'VERBAL', 'TECHNICAL', 'CODING')),
                        description TEXT,
                        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
                        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_topics_name ON topics (lower(name));

CREATE TABLE questions (
                           id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           topic_id    UUID        NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
                           statement   TEXT        NOT NULL,
                           difficulty  VARCHAR(10) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
                           explanation TEXT,
                           active      BOOLEAN     NOT NULL DEFAULT TRUE,
                           created_by  UUID        REFERENCES app_users(id) ON DELETE SET NULL,
                           created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                           updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_topic_difficulty ON questions (topic_id, difficulty);

CREATE TABLE question_options (
                                  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                                  sort_order  INTEGER NOT NULL CHECK (sort_order > 0),
                                  body        TEXT    NOT NULL,
                                  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
                                  CONSTRAINT uq_question_options_order UNIQUE (question_id, sort_order)
);

-- At most one correct option per question.
CREATE UNIQUE INDEX uq_question_one_correct ON question_options (question_id) WHERE is_correct;

CREATE TABLE coding_problems (
                                 id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 topic_id         UUID         NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
                                 title            VARCHAR(200) NOT NULL,
                                 statement        TEXT         NOT NULL,
                                 constraints_text TEXT,
                                 difficulty       VARCHAR(10)  NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
                                 time_limit_ms    INTEGER      NOT NULL DEFAULT 2000 CHECK (time_limit_ms BETWEEN 100 AND 10000),
                                 memory_limit_mb  INTEGER      NOT NULL DEFAULT 256  CHECK (memory_limit_mb BETWEEN 16 AND 512),
                                 active           BOOLEAN      NOT NULL DEFAULT TRUE,
                                 created_by       UUID         REFERENCES app_users(id) ON DELETE SET NULL,
                                 created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
                                 updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_coding_problems_topic_difficulty ON coding_problems (topic_id, difficulty);

CREATE TABLE test_cases (
                            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            problem_id      UUID    NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
                            sort_order      INTEGER NOT NULL CHECK (sort_order > 0),
                            input_data      TEXT    NOT NULL,
                            expected_output TEXT    NOT NULL,
                            is_hidden       BOOLEAN NOT NULL DEFAULT TRUE,
                            CONSTRAINT uq_test_cases_order UNIQUE (problem_id, sort_order)
);