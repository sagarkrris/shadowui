CREATE TABLE IF NOT EXISTS inbox (
    message_id uuid PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS outbox (
    message_id uuid PRIMARY KEY,
    sequence_id bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
    order_id uuid NOT NULL,
    topic text NOT NULL,
    payload text NOT NULL,
    published boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS outbox_pending ON outbox (sequence_id) WHERE NOT published;
