"""Virtual flush boundaries. No real filesystem or PostgreSQL durability test."""
buffered = []
local_durable = []
remote_durable = []


def recover(log):
    state = {}
    for key, value in log:
        state[key] = value
    return state


# Simulate acknowledgement before the log buffer reaches durable storage.
buffered.append(("order-104", "accepted"))
assert "order-104" not in recover(local_durable)
print("Before local flush: acknowledged write lost in this model")

# A flush in this model copies the log; it is not a real disk operation.
local_durable[:] = buffered
buffered.clear()
assert recover(local_durable)["order-104"] == "accepted"
print("After local flush: write recovered")
assert "order-104" not in recover(remote_durable)
print("Remote lag: failover loses the local-only write")
remote_durable[:] = local_durable
assert recover(remote_durable)["order-104"] == "accepted"
assert recover(remote_durable) == recover(remote_durable + remote_durable)
print("After remote flush: write recovered on the standby")
