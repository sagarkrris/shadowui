"""Sequential replay of commit-before-ack. In-memory SQLite; no broker."""
import sqlite3

with sqlite3.connect(":memory:") as db:
    db.execute("CREATE TABLE balance (amount INTEGER NOT NULL)")
    db.execute("INSERT INTO balance VALUES (0)")
    db.execute("CREATE TABLE processed (event_id TEXT PRIMARY KEY)")
    db.commit()
    # Delivery 1 commits; pretend its acknowledgement is lost. Delivery 2 repeats.
    for event_id in ["payment-17", "payment-17"]:
        with db:
            db.execute("UPDATE balance SET amount = amount + 10")
    assert db.execute("SELECT amount FROM balance").fetchone()[0] == 20
    print("Without deduplication: 20")
    with db:
        db.execute("UPDATE balance SET amount = 0")
    for event_id in ["payment-17", "payment-17"]:
        # Marker and database effect commit together. A duplicate does no work.
        with db:
            inserted = db.execute("INSERT OR IGNORE INTO processed VALUES (?)", (event_id,))
            if inserted.rowcount == 1:
                db.execute("UPDATE balance SET amount = amount + 10")
    assert db.execute("SELECT amount FROM balance").fetchone()[0] == 10
    print("Atomic marker + effect: 10")
