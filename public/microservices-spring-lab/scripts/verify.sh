#!/usr/bin/env bash
# Run from the extracted lab directory against a clean, running Compose stack.
set -euo pipefail

orders=http://127.0.0.1:8081
inventory=http://127.0.0.1:8082
payment=http://127.0.0.1:8083

current_fault_url=
remove_fault() {
  if [[ -n $current_fault_url ]]; then
    curl -fsS --max-time 5 -X DELETE "$current_fault_url" >/dev/null
    current_fault_url=
  fi
}
trap 'remove_fault || true' EXIT

wait_for() {
  local url=$1 expected=$2 attempt actual=
  for ((attempt=0; attempt<60; attempt++)); do
    actual=$(curl -sS --max-time 2 "$url" 2>/dev/null || true)
    if [[ $actual == *"$expected"* ]]; then return; fi
    sleep 1
  done
  printf 'Timed out: %s expected %s, got %s\n' "$url" "$expected" "$actual" >&2
  return 1
}

wait_for_log() {
  local service=$1 message=$2 required=${3:-1} attempt count=0
  for ((attempt=0; attempt<35; attempt++)); do
    count=$(docker compose logs --no-color "$service" | grep -Fc "$message" || true)
    if ((count >= required)); then return; fi
    sleep 1
  done
  printf 'Expected %s occurrences of %s in %s logs, saw %s\n' "$required" "$message" "$service" "$count" >&2
  return 1
}

sql() {
  docker compose exec -T "$1" psql -XqAt -v ON_ERROR_STOP=1 -U checkout -d checkout -c "$2"
}

assert_eq() {
  if [[ $1 != "$2" ]]; then
    printf 'Expected %s, got %s\n' "$2" "$1" >&2
    return 1
  fi
}

new_id() { uuidgen | tr '[:upper:]' '[:lower:]'; }

place() {
  curl -fsS --max-time 5 -X PUT "$orders/orders/$1?decision=$2" >/dev/null
}

enable_fault() {
  curl -fsS --max-time 5 -X PUT "$1" >/dev/null
  current_fault_url=$1
}

wait_for "$inventory/stock" '"available":'
probe=$(new_id)
wait_for "$orders/orders/$probe" '"status":404'
wait_for "$payment/payments/$probe" '"outcome":"ABSENT"'
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 10
assert_eq "$(sql orders-db "SELECT count(*) FROM orders")" 0

approved=$(new_id)
place "$approved" APPROVE &
first_submission=$!
place "$approved" APPROVE
wait "$first_submission"
wait_for "$orders/orders/$approved" '"status":"CONFIRMED"'
place "$approved" APPROVE
assert_eq "$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' -X PUT "$orders/orders/$approved?decision=DECLINE")" 409
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 9
assert_eq "$(sql orders-db "SELECT count(*) FROM outbox WHERE order_id = '$approved'")" 2
echo 'Checkout and idempotent HTTP requests passed'

replayed=$(new_id)
enable_fault "$orders/lab/faults/$replayed/PUBLISH_MARK"
place "$replayed" APPROVE
wait_for "$inventory/reservations/$replayed" '"status":"RESERVED"'
message_id=$(sql orders-db "SELECT message_id FROM outbox WHERE order_id = '$replayed' ORDER BY sequence_id LIMIT 1")
wait_for_log orders "Broker accepted message $message_id." 2
assert_eq "$(sql inventory-db "SELECT count(*) FROM reservation WHERE order_id = '$replayed'")" 1
assert_eq "$(sql inventory-db "SELECT count(*) FROM outbox WHERE order_id = '$replayed'")" 1
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 8
remove_fault
wait_for "$orders/orders/$replayed" '"status":"CONFIRMED"'
echo 'Kafka duplicate publication kept one reservation'

ambiguous=$(new_id)
enable_fault "$payment/lab/faults/$ambiguous/PAYMENT_ACK"
place "$ambiguous" APPROVE
wait_for "$payment/payments/$ambiguous" '"outcome":"CAPTURED"'
capture_id=$(sql orders-db "SELECT message_id FROM outbox WHERE order_id = '$ambiguous' AND topic = 'checkout.payment'")
wait_for_log payment "Injected lost offset acknowledgement after Payment commit for $ambiguous"
assert_eq "$(sql payment-db "SELECT count(*) FROM inbox WHERE message_id = '$capture_id'")" 1
docker compose restart payment
current_fault_url=
wait_for "$payment/payments/$ambiguous" '"outcome":"CAPTURED"'
wait_for_log payment "Ignored duplicate payment command $capture_id."
wait_for "$orders/orders/$ambiguous" '"status":"CONFIRMED"'
assert_eq "$(sql payment-db "SELECT count(*) FROM payment WHERE order_id = '$ambiguous'")" 1
assert_eq "$(sql payment-db "SELECT count(*) FROM outbox WHERE order_id = '$ambiguous'")" 1
echo 'Payment survives restart after a lost Kafka offset acknowledgement'

declined=$(new_id)
enable_fault "$inventory/lab/faults/$declined/RELEASE"
place "$declined" DECLINE
wait_for "$orders/orders/$declined" '"status":"COMPENSATING"'
wait_for "$inventory/reservations/$declined" '"status":"RESERVED"'
wait_for_log inventory "Injected release failure before commit for $declined"
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 6
remove_fault
wait_for "$orders/orders/$declined" '"status":"CANCELLED"'
wait_for "$inventory/reservations/$declined" '"status":"RELEASED"'
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 7
echo 'Failed compensation stayed pending and released exactly one unit on retry'

docker compose stop kafka
offline=$(new_id)
place "$offline" DECLINE
wait_for "$orders/orders/$offline" '"status":"RESERVING"'
assert_eq "$(sql orders-db "SELECT published FROM outbox WHERE order_id = '$offline'")" f
docker compose start kafka
wait_for "$orders/orders/$offline" '"status":"CANCELLED"'
wait_for "$inventory/reservations/$offline" '"status":"RELEASED"'
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 7
echo 'Pending outbox recovered after a real broker outage'

for ((i=0; i<6; i++)); do
  id=$(new_id)
  place "$id" APPROVE
  wait_for "$orders/orders/$id" '"status":"CONFIRMED"'
done
last_a=$(new_id)
last_b=$(new_id)
place "$last_a" APPROVE &
first_contender=$!
place "$last_b" APPROVE
wait "$first_contender"
for ((attempt=0; attempt<60; attempt++)); do
  final=$(sql orders-db "SELECT string_agg(status, ',' ORDER BY status) FROM orders WHERE order_id IN ('$last_a', '$last_b')")
  if [[ $final == CANCELLED,CONFIRMED ]]; then break; fi
  sleep 1
done
assert_eq "$final" CANCELLED,CONFIRMED
rejected=$(sql orders-db "SELECT order_id FROM orders WHERE order_id IN ('$last_a', '$last_b') AND status = 'CANCELLED'")
wait_for "$inventory/reservations/$rejected" '"status":"OUT_OF_STOCK"'
wait_for "$payment/payments/$rejected" '"outcome":"ABSENT"'
assert_eq "$(sql inventory-db "SELECT available FROM stock WHERE sku = 'DEMO'")" 0
echo 'Concurrent orders for the last unit produced one reservation and one uncharged cancellation'
