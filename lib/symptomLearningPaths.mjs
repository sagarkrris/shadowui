// Existing scenario content is reused on the public scenario pages and practice anchor.
export const SYMPTOM_LEARNING_PATHS = {
  'low-cpu-slow-requests': ['debug-java-high-cpu', 'java-thread-pool-saturation', 'Compare waiting with CPU work, then inspect the checkout pool exercise.'],
  'query-slower-after-index': ['slow-sql-query', 'postgresql-composite-index-dashboard', 'Apply plan evidence to a multi-tenant dashboard query used by a backend service.'],
  'messages-processed-twice': ['kafka-consumer-rebalancing', 'java-linkedhashset-dedup-events', 'Compare broker delivery with in-memory deduplication; the exercise does not provide durable exactly-once effects.'],
  'hashmap-entry-disappears': ['hashmap-internals', 'java-equals-hashcode-cache-key', 'Use equality and stable identity to diagnose the broken cache key.'],
  'transaction-does-not-roll-back': ['spring-transactional-not-working', 'spring-transaction-event-publish-failure', 'Transfer boundary reasoning to a database commit followed by a failed event publish.'],
  'async-method-blocks-caller': ['system-design-reliability', 'java-thread-pool-saturation', 'Connect executor behavior to saturation and bounded downstream work.'],
  'request-sees-previous-user': ['hashmap-vs-concurrenthashmap', 'java-thread-pool-saturation', 'Distinguish shared collection safety from context ownership when workers are reused.'],
  'concurrent-modification-single-thread': ['hashmap-vs-concurrenthashmap', 'java-linkedhashset-dedup-events', 'Practice collection ownership and ordering without relying on fail-fast behavior.'],
  'heap-grows-after-requests': ['jvm-memory-leak', 'java-equals-hashcode-cache-key', 'Investigate how broken key identity can retain more cache entries; this is one retention path, not every leak.'],
  'null-pointer-only-some-requests': ['hashmap-internals', 'java-equals-hashcode-cache-key', 'Practice distinguishing missing lookups from stored nulls and violated key contracts.'],
};
