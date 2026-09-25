// Explicit course assignments keep simulations tied to the subject being taught.
// Scripted traces offer contrasting scenarios; computed demos calculate their state from controls.
export const COURSE_DEMOS = {
  "payment": {
    "id": "payment",
    "title": "A lost response is not a failed payment",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What evidence would let you resolve the timeout without risking a second effect?",
    "lanes": [
      "Client",
      "Provider",
      "Charge count"
    ],
    "scenarios": [
      {
        "label": "Same operation key",
        "steps": [
          [
            "Send payment K7",
            "One intended payment has a stable identity.",
            [
              "waiting",
              "K7 received",
              "0"
            ]
          ],
          [
            "Provider commits",
            "The response is lost after the effect commits.",
            [
              "timeout: unknown",
              "K7 recorded",
              "1"
            ]
          ],
          [
            "Retry K7",
            "The model replays the retained result without another charge.",
            [
              "confirmed",
              "original result",
              "1"
            ]
          ]
        ]
      },
      {
        "label": "New operation key",
        "steps": [
          [
            "Send payment K7",
            "A timeout does not prove rejection.",
            [
              "waiting",
              "K7 received",
              "0"
            ]
          ],
          [
            "Lose the response",
            "The provider has already accepted the payment.",
            [
              "timeout: unknown",
              "K7 recorded",
              "1"
            ]
          ],
          [
            "Retry as K8",
            "A new key describes a different operation; this model accepts a second charge.",
            [
              "duplicate risk",
              "K7 + K8 recorded",
              "2"
            ]
          ]
        ]
      }
    ]
  },
  "pool": {
    "id": "pool",
    "title": "A full pool can mean long-held connections",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which metric distinguishes slow SQL from long connection hold time?",
    "lanes": [
      "Pool capacity",
      "Checked out",
      "Waiters"
    ],
    "scenarios": [
      {
        "label": "Prompt release",
        "steps": [
          [
            "Two requests arrive",
            "Both pool slots are acquired.",
            [
              "2",
              "2",
              "0"
            ]
          ],
          [
            "Third request waits",
            "A bounded queue protects capacity.",
            [
              "2",
              "2",
              "1"
            ]
          ],
          [
            "First request releases",
            "The waiter obtains the freed slot.",
            [
              "2",
              "2",
              "0"
            ]
          ]
        ]
      },
      {
        "label": "Hold during remote call",
        "steps": [
          [
            "Two requests acquire",
            "Both requests keep their connection during a remote wait.",
            [
              "2",
              "2",
              "0"
            ]
          ],
          [
            "Another request arrives",
            "Database execution may be idle even though the pool is full.",
            [
              "2",
              "2: waiting remotely",
              "1"
            ]
          ],
          [
            "Acquire deadline expires",
            "The queued request fails within its budget; increasing pool size does not fix long hold time.",
            [
              "2",
              "2",
              "0: timed out"
            ]
          ]
        ]
      }
    ]
  },
  "wal": {
    "id": "wal",
    "title": "Commit durability and recovery",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which guarantees depend on the database configuration and storage stack?",
    "lanes": [
      "Log",
      "Data page",
      "Recovery"
    ],
    "scenarios": [
      {
        "label": "Durable commit",
        "steps": [
          [
            "Write log records",
            "Changes enter the log before dirty data pages need flushing.",
            [
              "buffered",
              "old",
              "not run"
            ]
          ],
          [
            "Flush commit record",
            "Assume the configured durable commit contract and storage honors flush.",
            [
              "durable commit",
              "old",
              "not run"
            ]
          ],
          [
            "Crash and recover",
            "Replay committed changes not yet present in data pages.",
            [
              "durable commit",
              "new after redo",
              "committed state"
            ]
          ]
        ]
      },
      {
        "label": "Crash before durable commit",
        "steps": [
          [
            "Modify in memory",
            "An uncommitted operation is not a durable promise.",
            [
              "buffered",
              "old",
              "not run"
            ]
          ],
          [
            "Crash before flush",
            "The model loses buffered log records.",
            [
              "lost",
              "old",
              "starting"
            ]
          ],
          [
            "Recover prior state",
            "No durable commit exists for this operation.",
            [
              "prior log",
              "old",
              "operation absent"
            ]
          ]
        ]
      }
    ]
  },
  "strategy": {
    "id": "strategy",
    "title": "Swap a policy without changing checkout",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What invariant belongs in the policy contract regardless of implementation?",
    "lanes": [
      "Checkout",
      "Pricing policy",
      "Total"
    ],
    "scenarios": [
      {
        "label": "Standard pricing",
        "steps": [
          [
            "Receive order",
            "The domain workflow accepts an injected policy.",
            [
              "subtotal 100",
              "Standard",
              "pending"
            ]
          ],
          [
            "Delegate price",
            "Checkout calls the policy interface.",
            [
              "delegating",
              "return 100",
              "pending"
            ]
          ],
          [
            "Complete quote",
            "Construction happens outside the workflow.",
            [
              "quoted",
              "Standard",
              "100"
            ]
          ]
        ]
      },
      {
        "label": "Discount pricing",
        "steps": [
          [
            "Receive same order",
            "A different implementation enters through the same contract.",
            [
              "subtotal 100",
              "TenPercentOff",
              "pending"
            ]
          ],
          [
            "Delegate price",
            "The policy applies an explicit ten-percent discount.",
            [
              "delegating",
              "return 90",
              "pending"
            ]
          ],
          [
            "Complete quote",
            "No pricing branch was added to checkout.",
            [
              "quoted",
              "TenPercentOff",
              "90"
            ]
          ]
        ]
      }
    ]
  },
  "upgrade": {
    "id": "upgrade",
    "title": "Upgrade Java with a compatibility gate",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Why is compiling successfully insufficient evidence for a runtime upgrade?",
    "lanes": [
      "Candidate",
      "Verification",
      "Traffic"
    ],
    "scenarios": [
      {
        "label": "Compatible library",
        "steps": [
          [
            "Choose supported target",
            "Inventory language, library, and runtime assumptions.",
            [
              "new JDK",
              "pending",
              "old release"
            ]
          ],
          [
            "Run compatibility suite",
            "Representative tests pass under the candidate runtime.",
            [
              "new JDK",
              "pass",
              "old release"
            ]
          ],
          [
            "Canary and compare",
            "Promote only after latency, errors, and memory stay within agreed bounds.",
            [
              "new JDK",
              "canary passes",
              "canary then rollout"
            ]
          ]
        ]
      },
      {
        "label": "Incompatible library",
        "steps": [
          [
            "Choose supported target",
            "A runtime change must include dependency compatibility.",
            [
              "new JDK",
              "pending",
              "old release"
            ]
          ],
          [
            "Exercise integration",
            "An incompatible dependency fails a required test.",
            [
              "new JDK",
              "integration fails",
              "old release"
            ]
          ],
          [
            "Hold rollout",
            "Update or replace the dependency and repeat the gate.",
            [
              "blocked",
              "repair required",
              "old release"
            ]
          ]
        ]
      }
    ]
  },
  "saga": {
    "id": "saga",
    "title": "Recover a partially completed order",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What different recovery path is needed if payment times out instead of rejecting?",
    "lanes": [
      "Order",
      "Inventory",
      "Payment"
    ],
    "scenarios": [
      {
        "label": "Confirmed payment",
        "steps": [
          [
            "Reserve inventory",
            "Each service owns its local transaction.",
            [
              "pending",
              "reserved",
              "not started"
            ]
          ],
          [
            "Capture with stable identity",
            "Payment confirms acceptance.",
            [
              "pending",
              "reserved",
              "captured"
            ]
          ],
          [
            "Confirm order",
            "Durable workflow state records completion.",
            [
              "confirmed",
              "allocated",
              "captured"
            ]
          ]
        ]
      },
      {
        "label": "Definitive rejection",
        "steps": [
          [
            "Reserve inventory",
            "Reservation precedes payment in this chosen workflow.",
            [
              "pending",
              "reserved",
              "not started"
            ]
          ],
          [
            "Payment rejected",
            "This is a definitive rejection, not an ambiguous timeout.",
            [
              "compensating",
              "reserved",
              "rejected"
            ]
          ],
          [
            "Release reservation",
            "Compensation is a retryable new action, not a cross-service rollback.",
            [
              "canceled",
              "released",
              "rejected"
            ]
          ]
        ]
      }
    ]
  },
  "pointers": {
    "id": "pointers",
    "title": "Two pointers eliminate impossible pairs",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which assumption makes moving only one pointer safe?",
    "lanes": [
      "Left",
      "Right",
      "Decision"
    ],
    "scenarios": [
      {
        "label": "Target 6",
        "steps": [
          [
            "Sorted input: 1, 2, 4, 8",
            "Start at opposite ends.",
            [
              "1",
              "8",
              "sum 9 > 6"
            ]
          ],
          [
            "Move right inward",
            "Smaller right values may reach the target.",
            [
              "1",
              "4",
              "sum 5 < 6"
            ]
          ],
          [
            "Move left inward",
            "The pair is found.",
            [
              "2",
              "4",
              "sum 6: found"
            ]
          ]
        ]
      },
      {
        "label": "Target 20",
        "steps": [
          [
            "Sorted input: 1, 2, 4, 8",
            "The largest right value is 8.",
            [
              "1",
              "8",
              "sum 9 < 20"
            ]
          ],
          [
            "Advance left",
            "Keep eliminating values too small to reach the target.",
            [
              "2",
              "8",
              "sum 10 < 20"
            ]
          ],
          [
            "Last distinct pair",
            "4 + 8 is still too small; next move makes the pointers meet.",
            [
              "4",
              "8",
              "sum 12: no pair"
            ]
          ]
        ]
      }
    ]
  },
  "cache": {
    "id": "cache",
    "title": "Reject an old cache fill after invalidation",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Where must the version floor survive when a cached value is evicted?",
    "lanes": [
      "Reader",
      "Source",
      "Cache"
    ],
    "scenarios": [
      {
        "label": "Version floor retained",
        "steps": [
          [
            "Start old read",
            "A reader begins loading version 1.",
            [
              "loading v1",
              "v1",
              "v1"
            ]
          ],
          [
            "Write version 2",
            "Invalidation retains a minimum acceptable version.",
            [
              "v1 in flight",
              "v2",
              "empty; floor 2"
            ]
          ],
          [
            "Old response arrives",
            "The fill compares its version with the floor and rejects v1.",
            [
              "returns v1",
              "v2",
              "v1 fill rejected"
            ]
          ]
        ]
      },
      {
        "label": "Deletion only",
        "steps": [
          [
            "Start old read",
            "The same old read is still in flight.",
            [
              "loading v1",
              "v1",
              "v1"
            ]
          ],
          [
            "Write and delete",
            "Deletion alone forgets which versions are obsolete.",
            [
              "v1 in flight",
              "v2",
              "empty; no floor"
            ]
          ],
          [
            "Old response arrives",
            "A stale value repopulates the cache after invalidation.",
            [
              "returns v1",
              "v2",
              "v1: stale"
            ]
          ]
        ]
      }
    ]
  },
  "auth": {
    "id": "auth",
    "title": "A valid token does not grant tenant access",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which check is missing if an endpoint only verifies token presence?",
    "lanes": [
      "Identity",
      "Resource tenant",
      "Decision"
    ],
    "scenarios": [
      {
        "label": "Same tenant",
        "steps": [
          [
            "Validate token",
            "Assume signature, issuer, audience, and expiry all pass.",
            [
              "tenant A; read scope",
              "unknown",
              "pending"
            ]
          ],
          [
            "Load resource",
            "Authorization uses the actual resource owner.",
            [
              "tenant A",
              "A",
              "pending"
            ]
          ],
          [
            "Check scope and ownership",
            "Both checks succeed for this read.",
            [
              "valid + allowed",
              "A",
              "allow"
            ]
          ]
        ]
      },
      {
        "label": "Different tenant",
        "steps": [
          [
            "Validate token",
            "The same valid identity requests another tenant's resource.",
            [
              "tenant A; read scope",
              "unknown",
              "pending"
            ]
          ],
          [
            "Load resource",
            "Caller-supplied IDs are not proof of ownership.",
            [
              "tenant A",
              "B",
              "pending"
            ]
          ],
          [
            "Enforce ownership",
            "Deny without leaking the protected resource.",
            [
              "valid identity",
              "B",
              "deny"
            ]
          ]
        ]
      }
    ]
  },
  "breaker": {
    "id": "breaker",
    "title": "Circuit recovery is a controlled probe",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Why must probe calls still have deadlines?",
    "lanes": [
      "Circuit",
      "Dependency",
      "Admission"
    ],
    "scenarios": [
      {
        "label": "Probe succeeds",
        "steps": [
          [
            "Failure threshold reached",
            "Open the breaker to protect caller capacity.",
            [
              "OPEN",
              "failing",
              "reject"
            ]
          ],
          [
            "Cooldown elapsed",
            "Permit one bounded probe in this model.",
            [
              "HALF_OPEN",
              "probe running",
              "one probe"
            ]
          ],
          [
            "Probe succeeds",
            "Normal calls resume with timeouts still enforced.",
            [
              "CLOSED",
              "responding",
              "normal"
            ]
          ]
        ]
      },
      {
        "label": "Probe fails",
        "steps": [
          [
            "Failure threshold reached",
            "Opening does not repair the dependency.",
            [
              "OPEN",
              "failing",
              "reject"
            ]
          ],
          [
            "Cooldown elapsed",
            "Limit the recovery attempt.",
            [
              "HALF_OPEN",
              "probe running",
              "one probe"
            ]
          ],
          [
            "Probe fails",
            "Reopen and restart cooldown; do not release a retry storm.",
            [
              "OPEN",
              "still failing",
              "reject"
            ]
          ]
        ]
      }
    ]
  },
  "migration": {
    "id": "migration",
    "title": "Cut over only after data agrees",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What must be true before moving write ownership rather than just reads?",
    "lanes": [
      "Route",
      "New store",
      "Gate"
    ],
    "scenarios": [
      {
        "label": "Comparison matches",
        "steps": [
          [
            "Shadow reads",
            "Legacy remains authoritative.",
            [
              "legacy",
              "backfilled + catching up",
              "closed"
            ]
          ],
          [
            "Compare outputs",
            "Check business totals and keys, not only row counts.",
            [
              "legacy",
              "caught up; match",
              "canary ready"
            ]
          ],
          [
            "Canary reads",
            "Shift a small read cohort while preserving one write owner.",
            [
              "small new cohort",
              "verified",
              "observe"
            ]
          ]
        ]
      },
      {
        "label": "Comparison diverges",
        "steps": [
          [
            "Shadow reads",
            "Do not duplicate irreversible writes for comparison.",
            [
              "legacy",
              "backfilled + catching up",
              "closed"
            ]
          ],
          [
            "Compare outputs",
            "A mismatch blocks traffic promotion.",
            [
              "legacy",
              "mismatched totals",
              "blocked"
            ]
          ],
          [
            "Repair and replay",
            "Keep serving from legacy until evidence passes.",
            [
              "legacy",
              "reconciling",
              "closed"
            ]
          ]
        ]
      }
    ]
  },
  "capacity": {
    "id": "capacity",
    "title": "Find the bottleneck before adding servers",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which real workload assumptions could invalidate this simple ceiling calculation?",
    "lanes": [
      "App capacity",
      "Database capacity",
      "Throughput ceiling"
    ],
    "scenarios": [
      {
        "label": "Scale app only",
        "steps": [
          [
            "Baseline",
            "Toy capacities use equal-cost requests per second.",
            [
              "100/s",
              "120/s",
              "100/s"
            ]
          ],
          [
            "Double app fleet",
            "The downstream boundary becomes limiting.",
            [
              "200/s",
              "120/s",
              "120/s"
            ]
          ],
          [
            "Measure saturation",
            "More app capacity alone cannot raise the database ceiling.",
            [
              "200/s",
              "120/s: saturated",
              "120/s"
            ]
          ]
        ]
      },
      {
        "label": "Reduce database work",
        "steps": [
          [
            "Baseline",
            "Assume every request initially needs one database operation.",
            [
              "100/s",
              "120/s",
              "100/s"
            ]
          ],
          [
            "Double app fleet",
            "First identify the new bottleneck.",
            [
              "200/s",
              "120/s",
              "120/s"
            ]
          ],
          [
            "Halve DB work per request",
            "Under this simplified model the effective request capacity doubles.",
            [
              "200/s",
              "240 requests/s equivalent",
              "200/s"
            ]
          ]
        ]
      }
    ]
  },
  "retry": {
    "id": "retry",
    "title": "Retries share one deadline",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "How would an ambiguous write change this retry decision?",
    "lanes": [
      "Time remaining",
      "Attempt",
      "Outcome"
    ],
    "scenarios": [
      {
        "label": "Transient read failure",
        "steps": [
          [
            "Start safe read",
            "A 300 ms total budget covers all attempts and backoff.",
            [
              "300 ms",
              "1",
              "running"
            ]
          ],
          [
            "Fail after 80 ms; back off 40 ms",
            "Retry only an eligible failure.",
            [
              "180 ms",
              "2",
              "running"
            ]
          ],
          [
            "Read finishes in 100 ms",
            "Return before the deadline.",
            [
              "80 ms",
              "2",
              "success"
            ]
          ]
        ]
      },
      {
        "label": "Budget exhausted",
        "steps": [
          [
            "Start safe read",
            "No layer receives a new independent budget.",
            [
              "300 ms",
              "1",
              "running"
            ]
          ],
          [
            "Fail after 260 ms; reserve response time",
            "There is insufficient budget for another useful attempt.",
            [
              "40 ms",
              "1",
              "retry refused"
            ]
          ],
          [
            "Return bounded failure",
            "Do not turn a local retry into a deadline violation.",
            [
              "within deadline",
              "1",
              "failure"
            ]
          ]
        ]
      }
    ]
  },
  "communication": {
    "id": "communication",
    "title": "Make an interview answer inspectable",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What assumption would you ask the interviewer to confirm first?",
    "lanes": [
      "Claim",
      "Evidence",
      "Trade-off"
    ],
    "scenarios": [
      {
        "label": "Concrete reasoning",
        "steps": [
          [
            "State assumption",
            "Bound the problem before proposing a design.",
            [
              "50k active viewers",
              "requirement stated",
              "pending"
            ]
          ],
          [
            "Calculate load",
            "Show the arithmetic the interviewer can challenge.",
            [
              "5k polls/s",
              "50k / 10 seconds",
              "freshness ≈ 5 seconds"
            ]
          ],
          [
            "Compare alternative",
            "Connect the choice to an explicit cost.",
            [
              "consider streaming",
              "connection + buffer budget",
              "lower polling overhead"
            ]
          ]
        ]
      },
      {
        "label": "Unsupported conclusion",
        "steps": [
          [
            "State solution first",
            "A technology name alone does not establish fit.",
            [
              "use WebSockets",
              "none",
              "unstated"
            ]
          ],
          [
            "Question the assumption",
            "Ask whether both sides need frequent messages.",
            [
              "direction unclear",
              "missing requirement",
              "unknown"
            ]
          ],
          [
            "Repair the answer",
            "Supply the requirement and compare a simpler mechanism.",
            [
              "choose after evidence",
              "direction + freshness",
              "explicit"
            ]
          ]
        ]
      }
    ]
  },
  "concurrency": {
    "id": "concurrency",
    "title": "Lost updates need an atomic operation",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Would volatile alone make read-modify-write atomic?",
    "lanes": [
      "Worker A",
      "Worker B",
      "Counter"
    ],
    "scenarios": [
      {
        "label": "Read then write",
        "steps": [
          [
            "Both read zero",
            "Two reads observe the same old value.",
            [
              "read 0",
              "read 0",
              "0"
            ]
          ],
          [
            "A writes one",
            "The read-modify-write sequence is not atomic.",
            [
              "write 1",
              "holds 0",
              "1"
            ]
          ],
          [
            "B writes one",
            "One increment disappears.",
            [
              "done",
              "write 1",
              "1: lost update"
            ]
          ]
        ]
      },
      {
        "label": "Atomic increment",
        "steps": [
          [
            "Both intend an increment",
            "The increment operation is indivisible.",
            [
              "ready",
              "ready",
              "0"
            ]
          ],
          [
            "A increments",
            "Its atomic operation returns the next value.",
            [
              "done",
              "ready",
              "1"
            ]
          ],
          [
            "B increments",
            "The second operation sees the updated state.",
            [
              "done",
              "done",
              "2"
            ]
          ]
        ]
      }
    ]
  },
  "sql": {
    "id": "sql",
    "title": "Selective access versus scanning",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "When might a scan be cheaper than many random row fetches?",
    "lanes": [
      "Plan",
      "Rows examined",
      "Matches"
    ],
    "scenarios": [
      {
        "label": "Full scan",
        "steps": [
          [
            "Query id = 730",
            "Toy table has 1,000 unique IDs; page and cache costs are omitted.",
            [
              "scan",
              "0",
              "0"
            ]
          ],
          [
            "Scan first half",
            "No matching ID yet in this chosen order.",
            [
              "scan",
              "500",
              "0"
            ]
          ],
          [
            "Finish scan",
            "The predicate found one row after examining all rows.",
            [
              "scan",
              "1,000",
              "1"
            ]
          ]
        ]
      },
      {
        "label": "Unique index",
        "steps": [
          [
            "Query id = 730",
            "An index maps the key to a row location.",
            [
              "index seek",
              "0 rows; tree traversal",
              "0"
            ]
          ],
          [
            "Find leaf entry",
            "Tree/page work still has a cost.",
            [
              "index seek",
              "1 candidate",
              "0"
            ]
          ],
          [
            "Fetch row",
            "The same predicate returns the same result.",
            [
              "row fetch",
              "1 row",
              "1"
            ]
          ]
        ]
      }
    ]
  },
  "star": {
    "id": "star",
    "title": "Tell a STAR story with attributable evidence",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which result can you support with evidence from your own experience?",
    "lanes": [
      "Context",
      "Your action",
      "Result"
    ],
    "scenarios": [
      {
        "label": "Specific contribution",
        "steps": [
          [
            "Situation and task",
            "Describe a real constraint without identifying private customer data.",
            [
              "queue lag rising",
              "task: reduce delay",
              "baseline recorded"
            ]
          ],
          [
            "Action",
            "Separate your contribution from team effort.",
            [
              "consumer bottleneck",
              "bounded batch experiment",
              "canary compared"
            ]
          ],
          [
            "Result and reflection",
            "Use measured evidence and disclose its limits.",
            [
              "same workload",
              "rolled out after checks",
              "lag reduced; monitor retries"
            ]
          ]
        ]
      },
      {
        "label": "Vague team claim",
        "steps": [
          [
            "Situation",
            "The audience cannot assess an unspecified problem.",
            [
              "we improved it",
              "unclear",
              "unclear"
            ]
          ],
          [
            "Clarify ownership",
            "Name the decision you made and evidence you collected.",
            [
              "queue lag",
              "I tested batch size",
              "baseline vs canary"
            ]
          ],
          [
            "State bounded outcome",
            "Avoid invented percentages or taking credit for others' work.",
            [
              "specific scope",
              "team rollout; my test",
              "observed result + limits"
            ]
          ]
        ]
      }
    ]
  },
  "observability": {
    "id": "observability",
    "title": "Follow latency across boundaries",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Why is a slow span evidence for investigation rather than proof of root cause?",
    "lanes": [
      "Request",
      "Database span",
      "Remote span"
    ],
    "scenarios": [
      {
        "label": "Remote slowdown",
        "steps": [
          [
            "Receive request",
            "Start a trace with a bounded correlation identity.",
            [
              "0 ms",
              "pending",
              "pending"
            ]
          ],
          [
            "Database completes",
            "Local query is not the dominant wait in this trace.",
            [
              "20 ms",
              "20 ms",
              "running"
            ]
          ],
          [
            "Remote call completes",
            "Remote span explains most of the 520 ms request.",
            [
              "520 ms",
              "20 ms",
              "500 ms"
            ]
          ]
        ]
      },
      {
        "label": "Database slowdown",
        "steps": [
          [
            "Receive request",
            "Use the same boundaries for comparison.",
            [
              "0 ms",
              "running",
              "pending"
            ]
          ],
          [
            "Database completes",
            "A long database span narrows the next investigation.",
            [
              "500 ms",
              "500 ms",
              "running"
            ]
          ],
          [
            "Remote call completes",
            "Inspect query plans, locks, and pool time separately.",
            [
              "520 ms",
              "500 ms",
              "20 ms"
            ]
          ]
        ]
      }
    ]
  },
  "transaction": {
    "id": "transaction",
    "title": "Commit related local effects together",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Why does the relay still need duplicate-safe consumers?",
    "lanes": [
      "Order row",
      "Outbox row",
      "Transaction"
    ],
    "scenarios": [
      {
        "label": "Commit",
        "steps": [
          [
            "Begin transaction",
            "Both rows belong to one database transaction.",
            [
              "absent",
              "absent",
              "open"
            ]
          ],
          [
            "Write both rows",
            "Uncommitted changes are not yet a promise to the caller.",
            [
              "pending",
              "pending",
              "open"
            ]
          ],
          [
            "Commit",
            "A relay can later publish the durable outbox, possibly more than once.",
            [
              "durable",
              "durable",
              "committed"
            ]
          ]
        ]
      },
      {
        "label": "Failure before commit",
        "steps": [
          [
            "Begin transaction",
            "Start from the same state.",
            [
              "absent",
              "absent",
              "open"
            ]
          ],
          [
            "Write order; outbox insert fails",
            "The local unit must not partially commit.",
            [
              "pending",
              "failed",
              "rollback required"
            ]
          ],
          [
            "Rollback",
            "No successful order acknowledgment should be returned.",
            [
              "absent",
              "absent",
              "rolled back"
            ]
          ]
        ]
      }
    ]
  },
  "performance": {
    "id": "performance",
    "title": "Test one performance hypothesis",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which measurements would falsify your proposed optimization?",
    "lanes": [
      "Evidence",
      "Change",
      "Result"
    ],
    "scenarios": [
      {
        "label": "Allocation hotspot",
        "steps": [
          [
            "Capture comparable workload",
            "Latency alone does not identify the cause.",
            [
              "high allocation + GC pauses",
              "none",
              "baseline"
            ]
          ],
          [
            "Reduce temporary objects",
            "Change one measured hotspot.",
            [
              "same offered load",
              "fewer allocations",
              "canary"
            ]
          ],
          [
            "Compare distributions",
            "Keep only with acceptable latency, memory, and error results.",
            [
              "lower allocation",
              "validated",
              "p99 improves in test"
            ]
          ]
        ]
      },
      {
        "label": "Dependency bottleneck",
        "steps": [
          [
            "Capture comparable workload",
            "The trace shows waiting on a remote dependency.",
            [
              "remote wait dominates",
              "none",
              "baseline"
            ]
          ],
          [
            "Reduce local allocations",
            "This change does not target the measured delay.",
            [
              "remote wait unchanged",
              "fewer allocations",
              "canary"
            ]
          ],
          [
            "Reject hypothesis",
            "Return to the evidence; do not claim the optimization fixed latency.",
            [
              "same p99",
              "no latency benefit",
              "investigate dependency"
            ]
          ]
        ]
      }
    ]
  },
  "event": {
    "id": "event",
    "title": "A lost acknowledgment creates redelivery",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What extra contract is needed if the effect is a remote email send?",
    "lanes": [
      "Broker",
      "Consumer state",
      "Local effect count"
    ],
    "scenarios": [
      {
        "label": "Transactional deduplication",
        "steps": [
          [
            "Deliver E4",
            "Stable event identity arrives.",
            [
              "E4 unacked",
              "not processed",
              "0"
            ]
          ],
          [
            "Commit effect and marker",
            "The model stores both in one local transaction.",
            [
              "ack lost",
              "E4 processed",
              "1"
            ]
          ],
          [
            "Redeliver E4",
            "The existing marker suppresses the local effect.",
            [
              "E4 acknowledged",
              "duplicate ignored",
              "1"
            ]
          ]
        ]
      },
      {
        "label": "Marker stored separately",
        "steps": [
          [
            "Deliver E4",
            "No atomic relation protects the marker and effect.",
            [
              "E4 unacked",
              "not processed",
              "0"
            ]
          ],
          [
            "Effect commits; crash",
            "The marker never reaches durable storage.",
            [
              "ack lost",
              "marker absent",
              "1"
            ]
          ],
          [
            "Redeliver E4",
            "The consumer repeats the effect.",
            [
              "E4 acknowledged",
              "marker now stored",
              "2"
            ]
          ]
        ]
      }
    ]
  },
  "testing": {
    "id": "testing",
    "title": "Test the failure boundary, not just success",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Where must fault injection occur to test an ambiguous result?",
    "lanes": [
      "Test input",
      "System observation",
      "Assertion"
    ],
    "scenarios": [
      {
        "label": "Duplicate command",
        "steps": [
          [
            "Send command K1",
            "Use deterministic fixtures.",
            [
              "K1",
              "accepted",
              "pending"
            ]
          ],
          [
            "Replay K1",
            "The same intended operation repeats.",
            [
              "K1 again",
              "stored result",
              "pending"
            ]
          ],
          [
            "Assert business effect",
            "Count durable effects, not merely HTTP status.",
            [
              "two requests",
              "one effect",
              "pass if count = 1"
            ]
          ]
        ]
      },
      {
        "label": "Timeout after commit",
        "steps": [
          [
            "Send command K1",
            "Inject a lost reply after durable acceptance.",
            [
              "K1",
              "committed; reply lost",
              "pending"
            ]
          ],
          [
            "Client times out",
            "A timeout is not a rejection.",
            [
              "deadline exceeded",
              "unknown to client",
              "pending"
            ]
          ],
          [
            "Reconcile with K1",
            "Require recovery without a second effect.",
            [
              "same identity",
              "one effect confirmed",
              "pass if count = 1"
            ]
          ]
        ]
      }
    ]
  },
  "memory": {
    "id": "memory",
    "title": "Heap is only part of process memory",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Which evidence helps distinguish direct-buffer growth from too many threads?",
    "lanes": [
      "Java heap",
      "Other process memory",
      "Container total"
    ],
    "scenarios": [
      {
        "label": "Heap growth",
        "steps": [
          [
            "Baseline",
            "Toy accounting includes native regions and stacks in the other bucket.",
            [
              "300 MB",
              "200 MB",
              "500 / 800 MB"
            ]
          ],
          [
            "Retain objects",
            "Live retained objects increase heap occupancy.",
            [
              "500 MB",
              "200 MB",
              "700 / 800 MB"
            ]
          ],
          [
            "Investigate retention",
            "Use object-retention evidence before tuning limits.",
            [
              "550 MB",
              "200 MB",
              "750 / 800 MB"
            ]
          ]
        ]
      },
      {
        "label": "Native growth",
        "steps": [
          [
            "Baseline",
            "The heap graph alone is incomplete.",
            [
              "300 MB",
              "200 MB",
              "500 / 800 MB"
            ]
          ],
          [
            "Grow direct buffers or stacks",
            "Process memory rises while heap stays stable.",
            [
              "300 MB",
              "400 MB",
              "700 / 800 MB"
            ]
          ],
          [
            "Reach container limit",
            "A container kill is possible without a Java heap OOM.",
            [
              "300 MB",
              "500 MB",
              "800 / 800 MB: at risk"
            ]
          ]
        ]
      }
    ]
  },
  "evolution": {
    "id": "evolution",
    "title": "Preserve old clients while evolving an API",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "Why can an unchanged JSON shape still be a breaking change?",
    "lanes": [
      "Producer",
      "Old reader",
      "Outcome"
    ],
    "scenarios": [
      {
        "label": "Optional addition",
        "steps": [
          [
            "Original payload",
            "Old reader understands status.",
            [
              "status=READY",
              "status supported",
              "works"
            ]
          ],
          [
            "Add optional reason",
            "This scenario assumes readers ignore unknown optional fields.",
            [
              "status + reason",
              "ignores reason",
              "works"
            ]
          ],
          [
            "Verify compatibility",
            "Historical payloads still work for the new reader too.",
            [
              "additive contract",
              "contract test passes",
              "safe under assumptions"
            ]
          ]
        ]
      },
      {
        "label": "Change required meaning",
        "steps": [
          [
            "Original payload",
            "Clients rely on the current contract.",
            [
              "status=READY",
              "status supported",
              "works"
            ]
          ],
          [
            "Require a new field",
            "Old clients do not supply the field.",
            [
              "reason required",
              "reason absent",
              "request rejected"
            ]
          ],
          [
            "Hold rollout",
            "Version or stage the contract and migrate consumers.",
            [
              "breaking change blocked",
              "old contract retained",
              "migration needed"
            ]
          ]
        ]
      }
    ]
  },
  "configuration": {
    "id": "configuration",
    "title": "Validate configuration before admitting traffic",
    "kind": "trace",
    "scope": "A fixed teaching trace. Times and counts are illustrative; no real services or runtime are executed.",
    "question": "What configuration details should never appear in startup logs?",
    "lanes": [
      "Configuration",
      "Startup",
      "Traffic"
    ],
    "scenarios": [
      {
        "label": "Valid bounded timeout",
        "steps": [
          [
            "Read environment",
            "Treat external configuration as input.",
            [
              "timeout=500 ms",
              "validating",
              "not ready"
            ]
          ],
          [
            "Validate contract",
            "Required endpoint and timeout bounds pass.",
            [
              "valid",
              "initialized",
              "not ready"
            ]
          ],
          [
            "Mark ready",
            "Expose only safe version metadata, never credentials.",
            [
              "version v2",
              "ready",
              "admit"
            ]
          ]
        ]
      },
      {
        "label": "Invalid timeout",
        "steps": [
          [
            "Read environment",
            "The deployment supplies an invalid value.",
            [
              "timeout=-1 ms",
              "validating",
              "not ready"
            ]
          ],
          [
            "Reject configuration",
            "Do not silently substitute an unsafe behavior.",
            [
              "invalid",
              "startup fails",
              "not ready"
            ]
          ],
          [
            "Restore known version",
            "Rerun validation before serving.",
            [
              "version v1 valid",
              "restart + validate",
              "admit after ready"
            ]
          ]
        ]
      }
    ]
  },
  "routing": {
    "id": "routing",
    "title": "Route requests across unequal servers",
    "kind": "routing",
    "scope": "Eight equal-cost requests arrive before any completes. This model compares round robin with weighted active load; it does not simulate network or concurrency races.",
    "question": "When does a smaller request count still represent more resource pressure?"
  },
  "hashing": {
    "id": "hashing",
    "title": "Move keys when ring membership changes",
    "kind": "hashing",
    "scope": "Four prehashed keys on a 0–99 ring. Placement changes only; no data is copied and no real hashing is executed.",
    "question": "Why can a balanced key count still hide a hot backend?"
  },
  "replay": {
    "id": "replay",
    "title": "Reconnect with replay or snapshot recovery",
    "kind": "replay",
    "scope": "One authorized stream with a consistent snapshot boundary. The trace models application state rather than real browser networking.",
    "question": "What happens if snapshot state and its cursor are read at different times?"
  }
};

export const COURSE_DEMO_ASSIGNMENTS = {
  "api-gateway-production-patterns": ["auth", "routing", "retry"],
  "request-timed-out-did-payment-happen": [
    "payment"
  ],
  "connection-pool-full-is-database-slow": [
    "pool"
  ],
  "database-committed-what-survives-crash": [
    "wal"
  ],
  "load-balancing-algorithms": [
    "routing",
    "hashing"
  ],
  "real-time-communication-patterns": [
    "replay"
  ],
  "java-8-to-26-evolution": [
    "upgrade"
  ],
  "design-patterns-in-18-minutes": [
    "strategy"
  ],
  "java-design-patterns-with-diagrams": [
    "strategy"
  ],
  "learn-low-level-design-from-zero": [
    "strategy"
  ],
  "microservices-design-patterns": [
    "saga",
    "event"
  ],
  "leetcode-patterns": [
    "pointers"
  ],
  "distributed-transactions-data-consistency": [
    "saga",
    "transaction"
  ],
  "caching-patterns-java": [
    "cache"
  ],
  "spring-boot-security": [
    "auth"
  ],
  "resilience-engineering": [
    "breaker",
    "retry"
  ],
  "microservices-migration-patterns": [
    "migration"
  ],
  "system-design-concepts": [
    "capacity",
    "routing"
  ],
  "system-design-handbook": [
    "capacity",
    "hashing"
  ],
  "production-java-reliability": [
    "retry",
    "observability"
  ],
  "api-reliability-playbook": [
    "retry",
    "payment"
  ],
  "technical-interview-communication": [
    "communication"
  ],
  "java-concurrency-interviews": [
    "concurrency"
  ],
  "sql-performance-interviews": [
    "sql"
  ],
  "distributed-systems-interviews": [
    "hashing",
    "saga"
  ],
  "behavioral-star-interviews": [
    "star"
  ],
  "system-design-fundamentals-roadmap": [
    "capacity",
    "routing"
  ],
  "java-observability-opentelemetry": [
    "observability"
  ],
  "spring-transactions-data-access": [
    "transaction"
  ],
  "java-performance-clinic": [
    "performance"
  ],
  "event-driven-java-reliability": [
    "event"
  ],
  "production-java-testing": [
    "testing"
  ],
  "java-memory-management-evolution": [
    "memory"
  ],
  "java-api-evolution-contracts": [
    "evolution"
  ],
  "spring-boot-configuration": [
    "configuration"
  ]
};
