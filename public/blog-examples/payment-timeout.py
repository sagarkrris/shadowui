"""Deterministic model only: no provider API, persistence, concurrency, or payments."""
ledger = {}
charges = []


def pay(tenant, key, amount, lose_response=False):
    identity = (tenant, key)
    if identity in ledger:
        old_amount, charge_id = ledger[identity]
        if old_amount != amount:
            raise ValueError("same operation, different parameters")
    else:
        charge_id = len(charges) + 1
        charges.append((tenant, amount))
        ledger[identity] = (amount, charge_id)
    if lose_response:
        raise TimeoutError("effect exists; response lost")
    return charge_id


try:
    pay("alder", "order-104/payment-1", 2500, lose_response=True)
except TimeoutError:
    pass
assert pay("alder", "order-104/payment-1", 2500) == 1
assert len(charges) == 1
print("Lost response, same-key retry: 1 charge")
pay("alder", "fresh-key", 2500)
assert len(charges) == 2
print("New-key retry: 2 charges")
try:
    pay("alder", "order-104/payment-1", 2600)
    raise AssertionError("parameter conflict was accepted")
except ValueError:
    pass
assert pay("birch", "order-104/payment-1", 2500) == 3
print("Changed parameters rejected; tenant scope isolated")
