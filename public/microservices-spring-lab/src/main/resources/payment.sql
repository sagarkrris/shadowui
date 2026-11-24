CREATE TABLE IF NOT EXISTS payment (
    order_id uuid PRIMARY KEY,
    outcome text NOT NULL
);
