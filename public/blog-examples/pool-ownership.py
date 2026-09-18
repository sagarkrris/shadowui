"""Virtual ownership timeline, not JDBC, threads, or a throughput benchmark."""
from heapq import heappop, heappush
from math import inf


def checkout(available_at, arrival, hold):
    free_at = heappop(available_at)
    if free_at == inf:
        heappush(available_at, free_at)
        raise TimeoutError("no resource is returned in this model")
    acquired = max(arrival, free_at)
    heappush(available_at, acquired + hold)
    return acquired - arrival


pool = [0, 0]
assert checkout(pool, 0, 100) == 0
assert checkout(pool, 0, 100) == 0
assert checkout(pool, 0, 5) == 100
print("SQL time: 5 ticks; connection hold: 100 ticks")
print("Third caller waits: 100 ticks")
short_ownership = [0, 0]
checkout(short_ownership, 0, 5)
checkout(short_ownership, 0, 5)
assert checkout(short_ownership, 0, 5) == 5
print("Shorter ownership waits: 5 ticks")
leaked = [inf, inf]
try:
    checkout(leaked, 0, 5)
    raise AssertionError("leaked capacity was reusable")
except TimeoutError:
    pass
assert leaked == [inf, inf]
print("Never-returned resources exhaust acquisition")
