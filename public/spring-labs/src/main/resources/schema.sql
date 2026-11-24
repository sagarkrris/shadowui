create table inventory (
    sku varchar(32) primary key,
    remaining integer not null check (remaining >= 0)
);
create table orders (
    id uuid primary key,
    sku varchar(32) not null references inventory(sku),
    quantity integer not null check (quantity > 0),
    placed_at timestamp with time zone not null
);
insert into inventory (sku, remaining) values ('NOTEBOOK', 5);
insert into inventory (sku, remaining) values ('PENCIL', 2);
