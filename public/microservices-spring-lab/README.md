# Checkout capstone with Spring Boot, PostgreSQL and Kafka

Run three real Spring Boot processes. Each container uses a role profile and
connects to its own PostgreSQL database. Kafka carries commands and replies.
They share one Java 21 / Spring Boot 4.0.0 build so you can read the whole
workflow without maintaining three copies of transport code. Payment records a
synthetic approval or decline in PostgreSQL.

| Service | Local URL | Owns | Consumes |
| --- | --- | --- | --- |
| Orders | http://127.0.0.1:8081 | Order status and saga | `checkout.orders` replies |
| Inventory | http://127.0.0.1:8082 | Stock and reservations | `checkout.inventory` commands |
| Payment | http://127.0.0.1:8083 | Payment outcome | `checkout.payment` commands |

## 1. Start the stack

Install Docker with the Compose v2 plugin. Start the Docker daemon and make
ports 8081–8083 available. Use a Bash shell with curl and uuidgen. Running the
container build requires network access to the image registry and Maven Central.
Java and Maven run inside the build image.

```sh
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs -f orders inventory payment
```

Once the applications start, leave the logs with Ctrl-C. The services keep
running. Check that Inventory reports ten available units on a new stack.

```sh
curl -fsS http://127.0.0.1:8082/stock
```

The base images are the Java 21 Maven and Temurin images, PostgreSQL 17, and the
Apache Kafka 3.9.2 JVM image. Compose waits for the individual database and
broker health checks before starting the application containers.

## 2. Trace checkout

```sh
ORDER=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -i -X PUT "http://127.0.0.1:8081/orders/$ORDER?decision=APPROVE"
curl -fsS "http://127.0.0.1:8081/orders/$ORDER"
curl -fsS "http://127.0.0.1:8082/reservations/$ORDER"
curl -fsS "http://127.0.0.1:8083/payments/$ORDER"
```

The first call returns HTTP 202 and a Location. Poll the order until it is
`CONFIRMED`. Inventory should report `RESERVED` and Payment `CAPTURED`.
Repeat the PUT with the same ID and decision. It returns the same order without
enqueueing another reservation. A different decision for that ID returns 409.

A checkout starts at `RESERVING`. Orders writes that state and a reserve command
in one SQL transaction. Inventory locks the stock row through a conditional SQL
update and writes its reply into its outbox. The reply advances Orders to
`PAYING`. A definitive decline leads to `COMPENSATING` and a release command.
Orders reports `CANCELLED` after Inventory confirms release. When stock is
unavailable, Orders cancels before sending a payment command.

Use these queries to inspect the evidence. Each database connection stays
inside the corresponding Compose container.

```sh
docker compose exec -T orders-db psql -U checkout -d checkout -c 'SELECT * FROM orders'
docker compose exec -T orders-db psql -U checkout -d checkout -c 'SELECT message_id, order_id, topic, published FROM outbox ORDER BY sequence_id'
docker compose exec -T inventory-db psql -U checkout -d checkout -c 'SELECT * FROM reservation'
docker compose exec -T payment-db psql -U checkout -d checkout -c 'SELECT * FROM payment'
```

## 3. Publish twice after Kafka accepts a message

```sh
ORDER=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -fsS -X PUT "http://127.0.0.1:8081/lab/faults/$ORDER/PUBLISH_MARK"
curl -fsS -X PUT "http://127.0.0.1:8081/orders/$ORDER?decision=APPROVE"
docker compose logs --tail=20 orders
curl -fsS "http://127.0.0.1:8082/reservations/$ORDER"
curl -fsS -X DELETE "http://127.0.0.1:8081/lab/faults/$ORDER/PUBLISH_MARK"
```

Before disabling the fault, wait for repeated “Broker accepted message” log
lines for the same message UUID. The relay keeps publishing the pending outbox
row with the same ID. Inventory claims that ID with a unique inbox insert in the
same transaction as its business effect and reply. Stock should fall by one
unit. After disabling the fault, polling Orders should eventually show
`CONFIRMED`. The single relay processes rows in order, so holding its marker
also delays later publications from Orders.

## 4. Restart after Payment committed but before the Kafka offset advanced

```sh
ORDER=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -fsS -X PUT "http://127.0.0.1:8083/lab/faults/$ORDER/PAYMENT_ACK"
curl -fsS -X PUT "http://127.0.0.1:8081/orders/$ORDER?decision=APPROVE"
curl -fsS "http://127.0.0.1:8083/payments/$ORDER"
docker compose logs --tail=25 payment
docker compose restart payment
curl -fsS "http://127.0.0.1:8081/orders/$ORDER"
```

Wait for `CAPTURED` and an “Injected lost offset acknowledgement” log before
restarting. The listener commits the payment row, inbox and outgoing reply in
one PostgreSQL transaction, then throws before acknowledging the consumed Kafka
record. Kafka can redeliver after restart. The fault switch clears on process
restart, while the durable inbox prevents a second payment or response. Orders
may confirm while the fault is still active because Payment's outbox relay is
independent of its consumer offset. A missing acknowledgement by itself is no
basis for releasing stock or charging again.

## 5. Fail a compensation, then recover

```sh
ORDER=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -fsS -X PUT "http://127.0.0.1:8082/lab/faults/$ORDER/RELEASE"
curl -fsS -X PUT "http://127.0.0.1:8081/orders/$ORDER?decision=DECLINE"
curl -fsS "http://127.0.0.1:8081/orders/$ORDER"
curl -fsS "http://127.0.0.1:8082/reservations/$ORDER"
curl -fsS -X DELETE "http://127.0.0.1:8082/lab/faults/$ORDER/RELEASE"
```

Poll until Orders shows `COMPENSATING` and Inventory shows `RESERVED`. The
injected exception rolls back the release transaction and its inbox claim.
Remove the fault, then poll until Order shows `CANCELLED` and Inventory
`RELEASED`. Its stock balance increases exactly once.

## 6. Stop the broker and inspect the outbox

With a stock unit still available, use a fresh order. PostgreSQL stays running.

```sh
docker compose stop kafka
ORDER=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -i -X PUT "http://127.0.0.1:8081/orders/$ORDER?decision=APPROVE"
docker compose exec -T orders-db psql -U checkout -d checkout -c 'SELECT order_id, published FROM outbox WHERE NOT published'
docker compose start kafka
```

While Kafka is unavailable, Order acceptance can still commit and the outbox
row remains pending. Once the broker is ready, poll for `CONFIRMED`.
A timeout during a broker send can also have an unknown result. The relay
keeps the same message ID every time it retries.

## 7. Prove the invariants and clean up

The verification script expects a fresh stack with ten units and zero orders.
Run it before the manual drills or use a clean throwaway lab project for the
script. It checks HTTP idempotency, duplicate publication, post-commit
redelivery, compensation, a broker outage, and concurrent orders for the last stock unit.

```sh
bash scripts/verify.sh
docker compose down
```

`down` preserves data. To deliberately erase **only this lab's** databases and
broker log, run `docker compose down --volumes` from this lab directory.

## Design decisions and references

- One scheduled relay per service sends in insertion order. A unique inbox key
  handles stable message IDs. Per-order state guards and unique business keys
  protect the exercise against repeated commands. For horizontal scaling,
  claim rows explicitly with leases or use CDC, and preserve the required
  order. Define retention and poison-message handling before using this design
  with real traffic.
- The lab uses a single broker with one partition per topic, local HTTP fault
  switches, sample passwords, retry-until-recovered for the injected failures
  and retained inbox/outbox rows. A blocked record can stall that partition.
  Keep the ports loopback-only. Production needs authentication, authorization,
  encrypted transport, observability, bounded retry policy and an operator
  recovery workflow. An external payment provider also needs its own
  idempotency key and lookup or reconciliation API.
- Read the [Spring Boot Kafka integration](https://docs.spring.io/spring-boot/4.0/reference/messaging/kafka.html),
  [Spring Kafka record acknowledgment](https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html),
  [PostgreSQL ON CONFLICT](https://www.postgresql.org/docs/17/sql-insert.html),
  [Apache Kafka Docker documentation](https://kafka.apache.org/39/getting-started/docker/),
  and [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order).
