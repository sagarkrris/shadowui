CREATE TABLE IF NOT EXISTS stock (
    sku text PRIMARY KEY,
    available integer NOT NULL CHECK (available >= 0)
);
INSERT INTO stock (sku, available) VALUES ('DEMO', 10) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS reservation (
    order_id uuid PRIMARY KEY,
    status text NOT NULL
);
