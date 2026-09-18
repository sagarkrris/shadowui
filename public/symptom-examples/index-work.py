"""Controlled SQLite index comparison. Forced plans, not optimizer prediction."""
import sqlite3

with sqlite3.connect(":memory:") as db:
    db.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, tenant INTEGER)")
    db.executemany("INSERT INTO orders VALUES (?, ?)", [(i, i % 100) for i in range(10000)])
    db.execute("CREATE INDEX by_id ON orders(id)")
    db.execute("CREATE INDEX by_tenant_id ON orders(tenant, id)")
    counts = []
    def probe(value):
        counts[-1] += 1
        return value
    db.create_function("probe", 1, probe)
    # probe(tenant) deliberately keeps the filter outside index lookup in the
    # first query; INDEXED BY deliberately fixes the two access paths.
    queries = [
        "SELECT id FROM orders INDEXED BY by_id WHERE probe(tenant) = 7 ORDER BY id",
        "SELECT id FROM orders INDEXED BY by_tenant_id WHERE tenant = 7 AND probe(tenant) = 7 ORDER BY id",
    ]
    results = []
    for query in queries:
        counts.append(0)
        results.append(db.execute(query).fetchall())
    assert results[0] == results[1]
    assert counts == [10000, 100], counts
    print("Same result: 100 rows")
    print("Broad index path: 10000 filter evaluations")
    print("Tenant index path: 100 filter evaluations")
