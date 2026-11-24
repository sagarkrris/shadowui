CREATE TABLE IF NOT EXISTS orders (
    order_id uuid PRIMARY KEY,
    decision text NOT NULL,
    status text NOT NULL
);
