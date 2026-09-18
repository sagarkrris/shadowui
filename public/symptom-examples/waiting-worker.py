"""A parked worker prevents queued work from starting. No CPU benchmark."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event

started, release = Event(), Event()

def blocked_request():
    started.set()
    if not release.wait(timeout=5):
        raise TimeoutError("Fixture release was not signalled")
    return "released"

with ThreadPoolExecutor(max_workers=1) as pool:
    first = pool.submit(blocked_request)
    try:
        assert started.wait(timeout=2), "Worker did not start"
        second = pool.submit(lambda: "completed")
        assert not second.done(), "Second request should be queued"
        print("Worker: waiting; second request: queued")
    finally:
        release.set()
    assert first.result(timeout=2) == "released"
    assert second.result(timeout=2) == "completed"
    print("Release the wait: both requests complete")
