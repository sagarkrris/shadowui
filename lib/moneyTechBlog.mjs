export const MONEY_BLOG = {
  id: 'java-money-production', title: 'Java Money: Minor Units, Rounding, FX, and Reconciliation', category: 'Java backend correctness', javaRelease: 17,
  sourceUrl: 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html',
  summary: 'A practical Java 17 course on preserving monetary meaning from input through calculation, exchange-rate selection, durable posting, and reconciliation.',
  lessons: ['Money is an amount plus currency and authoritative scale, never a floating-point number or display string.', 'Rounding, allocation, and foreign exchange are explicit versioned policies.', 'A lost provider response is an owned reconciliation problem, not arithmetic failure.'],
  sections: [{ heading: 'Course goal', body: 'Make financial calculations repeatable and auditable when requests retry, totals split, exchange rates change, and a provider may have acted before its response was lost.' }, { heading: 'Example scope', body: 'The standalone Java 17 examples are deterministic calculation and state models. They do not provide ISO 4217 metadata, tax or accounting advice, provider integration, a ledger database, authorization, or legally compliant records.' }, { heading: 'Ownership rule', body: 'The ledger or payment owner chooses currency metadata, rounding, rate source, retention, idempotency, and final reconciliation. Client-provided amounts, currencies, and rates are inputs to validate, never authority to post.' }],
  example: 'validated input → integer minor units → explicit policy + rate snapshot → durable intent → posted or reconcile',
  interviewQuestions: ['Why is double unsuitable for monetary totals?', 'How do you allocate an indivisible cent without changing the invoice total?', 'What remains unknown after a payment provider times out?'],
  practice: 'Design a multi-currency invoice capture: define currency metadata ownership, parsing, rounding and residual policy, rate-snapshot retention, idempotency key, reconciliation workflow, and audit-safe signals.',
  capstone: { title: 'Capstone: Capture a split invoice across a provider timeout', scenario: 'A checkout service receives a EUR invoice, allocates a discount, quotes it in USD, and calls a provider. The client retries after a timeout while the rate feed later publishes a newer quote.', steps: ['Persist minor units, rounding-policy version, allocation residuals, and selected rate snapshot before dispatch.', 'Use one durable operation and provider idempotency key; never reprice a retry with a newer rate.', 'Treat a lost response as UNKNOWN, reconcile the original identity, and expose unresolved operations to an accountable owner.'], outcome: 'A design that preserves the original financial decision across retries and makes uncertain outcomes visible until reconciled.' },
};

export const MONEY_CHAPTERS = [
  { title: '1. Model money in minor units with explicit currency', lesson: 'Store money as an integer count of authoritative minor units with its currency code. Do not use double or float: binary fractions cannot exactly represent many decimal values. A long still has bounds, so use checked arithmetic and define sign rules. The three-letter code in this model is not currency metadata; production must obtain allowed currencies and fraction digits from a versioned authority rather than a display string.', whenToUse: 'Use minor units and checked arithmetic for persisted amounts, API contracts, and reproducible calculations.', avoid: 'Avoid double, locale-formatted strings, or assuming every currency has two decimal places.', diagram: 'authoritative currency metadata → validated minor-unit amount → checked arithmetic → durable financial intent', example: `final class MoneyContractExample {
  record Money(long minor, String currency) {
    Money { if (currency == null || !currency.matches("[A-Z]{3}")) throw new IllegalArgumentException("currency"); }
  }
  static Money add(Money left, Money right) {
    if (left == null || right == null || !left.currency().equals(right.currency())) throw new IllegalArgumentException("currency mismatch");
    return new Money(Math.addExact(left.minor(), right.minor()), left.currency());
  }
}`, exercise: 'For a refund API, define currency-metadata ownership, sign rules, the largest accepted amount, and how an old persisted policy is interpreted.', quiz: 'Why is a two-decimal display rule not enough to define money?', answer: 'Display formatting is not arithmetic semantics. Fraction digits, sign rules, bounds, and rounding belong to an authoritative contract; 105 minor units means nothing without currency and policy.' },
  { title: '2. Parse decimal input without locale or silent rounding', lesson: 'Parse a documented machine decimal with BigDecimal, validate fraction digits, shift to minor units, and require exact conversion. Reject excess precision instead of silently rounding a request: accepting 10.999 for a two-decimal charge changes financial intent. Keep locale-aware formatting at the UI edge; an API should use a machine format or explicit integer minor units. Never let blank or malformed input become zero.', whenToUse: 'Use exact parsing at an API or import boundary before persisting or quoting an amount.', avoid: 'Avoid parsing localized display values in business logic or rounding input before the customer accepts the result.', diagram: 'machine decimal + policy fraction digits → exact BigDecimal shift → minor units\ninvalid or over-precise input → reject before intent', example: `import java.math.*;
final class MoneyParsingExample {
  static long parseMinor(String decimal, int fractionDigits) {
    // Bounded ASCII plain decimal: no exponent, whitespace, or locale separators.
    if (decimal == null || decimal.length() > 64 || !decimal.matches("-?[0-9]+([.][0-9]+)?") || fractionDigits < 0 || fractionDigits > 9) throw new IllegalArgumentException("amount");
    try { return new BigDecimal(decimal).movePointRight(fractionDigits).setScale(0, RoundingMode.UNNECESSARY).longValueExact(); }
    catch (NumberFormatException | ArithmeticException invalid) { throw new IllegalArgumentException("amount", invalid); }
  }
}`, exercise: 'Specify accepted wire format for USD, JPY, and a three-fraction-digit currency. Decide how blank, negative, malformed, and over-precise values behave.', quiz: 'Why reject an over-precise charge instead of choosing HALF_UP?', answer: 'Rounding changes the requested amount. The payer, quote, or explicit policy must choose that change; a parser cannot safely invent it.' },
  { title: '3. Make rounding and residual allocation a versioned policy', lesson: 'Rounding is a business rule, not presentation. Persist its scale, tie rule, tax basis, and version with a posting. Splitting indivisible units requires a deterministic residual policy. This sample uses largest remainder: floor shares, then give leftover units to largest fractional remainders with original index as a tie-breaker. It preserves the total exactly, but whether it is fair for a discount, tax, or settlement is a domain decision.', whenToUse: 'Use versioned rounding and residual rules when tax, fees, discounts, or settlements divide a total.', avoid: 'Avoid rounding each line independently or using an undocumented tie-breaker.', diagram: 'total + weights + policy version → floor shares → ordered residual units → exact sum\npolicy change → new version, never rewrite old posting', example: `import java.math.*;
import java.util.*;
final class MoneyAllocationExample {
  static long[] allocate(long total, int[] weights) {
    if (total < 0 || weights == null || weights.length == 0) throw new IllegalArgumentException();
    BigInteger sum = BigInteger.ZERO; for (int w : weights) { if (w <= 0) throw new IllegalArgumentException(); sum = sum.add(BigInteger.valueOf(w)); }
    long[] shares = new long[weights.length]; BigInteger[] remainders = new BigInteger[weights.length]; long assigned = 0;
    for (int i = 0; i < weights.length; i++) { BigInteger[] qr = BigInteger.valueOf(total).multiply(BigInteger.valueOf(weights[i])).divideAndRemainder(sum); shares[i] = qr[0].longValueExact(); remainders[i] = qr[1]; assigned = Math.addExact(assigned, shares[i]); }
    Integer[] order = new Integer[weights.length]; for (int i = 0; i < order.length; i++) order[i] = i;
    Arrays.sort(order, (a, b) -> { int c = remainders[b].compareTo(remainders[a]); return c != 0 ? c : Integer.compare(a, b); });
    for (long extra = total - assigned, i = 0; i < extra; i++) shares[order[(int) i]] = Math.addExact(shares[order[(int) i]], 1);
    return shares;
  }
}`, exercise: 'Allocate a 5-cent discount across three equal lines. Record the policy version and explain why input order needs a stated tie-breaker.', quiz: 'Why retain the residual policy with a posted invoice?', answer: 'Several valid methods produce different line amounts while preserving the total. The exact policy and version let an audit or retry reproduce the original result.' },
  { title: '4. Quote foreign exchange from a bounded snapshot', lesson: 'An FX conversion records base and counter currencies, rate precision, source, timestamp, and quote version. Validate quote direction and bounded age, then apply declared rounding. Do not fetch a new rate during retry of an accepted operation; retain the selected snapshot or deliberately create a new quote before a new operation. A feed outage is not permission for unbounded stale data.', whenToUse: 'Use a retained rate snapshot when a quote or settlement must be reproducible across retries.', avoid: 'Avoid silently reversing a rate, trusting a client rate, or applying a newer rate to an accepted intent.', diagram: 'rate source → versioned quote snapshot + age check → explicit conversion rounding → durable operation\nretry → original snapshot; new quote → new operation', example: `import java.math.*;
final class FxQuoteExample {
  record Quote(String base, String counter, BigDecimal rate, long asOfMillis, String version) {
    Quote { if (base == null || counter == null || !base.matches("[A-Z]{3}") || !counter.matches("[A-Z]{3}") || base.equals(counter) || rate == null || rate.signum() <= 0 || asOfMillis < 0 || version == null || version.isBlank()) throw new IllegalArgumentException(); }
  }
  // Rate is counter MAJOR units per base MAJOR unit. Scales come from
  // retained authoritative currency metadata, not request-supplied claims.
  static long convert(long baseMinor, String expectedBase, String expectedCounter, Quote quote, long now, long maxAge, RoundingMode mode, int baseDigits, int counterDigits) {
    if (baseDigits < 0 || baseDigits > 9 || counterDigits < 0 || counterDigits > 9) throw new IllegalArgumentException();
    if (baseMinor < 0 || expectedBase == null || expectedCounter == null || quote == null || now < quote.asOfMillis() || maxAge < 0 || mode == null || !quote.base().equals(expectedBase) || !quote.counter().equals(expectedCounter) || now - quote.asOfMillis() > maxAge) throw new IllegalArgumentException();
    return BigDecimal.valueOf(baseMinor, baseDigits).multiply(quote.rate())
        .movePointRight(counterDigits).setScale(0, mode).longValueExact();
  }
}`, walkthrough: 'Convert 100 USD minor units at 150 JPY per USD: 100 / 100 = 1 USD; 1 × 150 = 150 JPY; JPY has zero fraction digits, so the result is 150 minor units. Retain both currency scales with the rate. Freshness gates a new quote; a retry reuses its persisted amount even when that original quote is now old.', exercise: 'Define owner, maximum age, rounding, feed fallback, and retention for an EUR-to-USD checkout quote. State when a retry reconciles instead of reprices.', quiz: 'Why is a current FX rate not necessarily correct for a retry?', answer: 'The original quote may already be accepted, displayed, or sent to a provider. Repricing turns one operation into a different financial intent; retain it or create a new operation.' },
  { title: '5. Persist intent before dispatch and preserve ambiguity', lesson: 'Arithmetic cannot make an external payment exactly once. Persist durable operation identity, amount, currency, policy versions, selected rate snapshot, and provider idempotency key before dispatch. Retries use that same identity. A timeout after dispatch is UNKNOWN, not failure, cancellation, or permission to charge again. Query the provider or ledger by the original key and let reconciliation own recovery. Client cancellation can end waiting without stopping accepted provider work.', whenToUse: 'Use durable intent and reconciliation for charges, refunds, transfers, or settlements with external side effects.', avoid: 'Avoid generating a new key on timeout, treating cancelled HTTP as reversed payment, or retrying at multiple layers.', diagram: 'durable intent + idempotency key → provider dispatch → response / UNKNOWN\nUNKNOWN → reconcile same key → posted, rejected, or unresolved', example: `final class PaymentOutcomeExample {
  enum State { READY, SENT, POSTED, REJECTED, UNKNOWN }
  static State afterDispatch(boolean responseReceived, boolean providerPosted, boolean providerRejected) {
    if (providerPosted && providerRejected) throw new IllegalArgumentException();
    if (!responseReceived) return State.UNKNOWN;
    return providerPosted ? State.POSTED : providerRejected ? State.REJECTED : State.UNKNOWN;
  }
  // Eligibility only: the owner also serializes dispatch, checks cancellation,
  // and enforces a bounded retry budget. Guarantee includes same intent and
  // provider retention covering this attempt; a key by itself is insufficient.
  static boolean mayRetry(State state, String durableKey, boolean providerGuaranteeValid) {
    if (state == null || durableKey == null || durableKey.isBlank()) throw new IllegalArgumentException();
    return state == State.READY || (providerGuaranteeValid && (state == State.SENT || state == State.UNKNOWN));
  }
}`, walkthrough: 'UNKNOWN with op-1 and no valid provider guarantee returns false. With durable same-key/same-intent deduplication still covering this attempt, it is a retry candidate. Expired provider retention makes it false again. The owner must also serialize dispatch, honor cancellation before dispatch, and check its retry budget; a client cancellation after dispatch never proves reversal.', exercise: 'Write durable fields and owner transitions for a card charge timing out after provider receipt. Include the user-visible pending outcome and reconciliation deadline.', quiz: 'Why is cancelling a client request not proof no payment was captured?', answer: 'The request may already cross the provider boundary while its response is lost. Preserve UNKNOWN with the original durable identity and reconcile rather than charge again or declare reversal.' },
  { title: '6. Reconcile, retain evidence, and close deliberately', lesson: 'Reconciliation compares owned intent and posting records with authoritative provider or bank evidence using stable operation identities, not amount-and-time guesses. Preserve discrepancy when evidence is absent or contradictory; do not blindly replay. Bound metrics by outcome, currency, policy version, and age bucket rather than customer identifiers. Terminal records stay terminal when late callbacks arrive.', whenToUse: 'Use a reconciliation queue and terminal-state rule for every financial integration with delayed or ambiguous outcomes.', avoid: 'Avoid auto-closing missing evidence, logging raw payment data, or late callbacks overwriting a terminal decision.', diagram: 'intent + posting record + external evidence → match / mismatch / absent\nabsent or mismatch → owned reconciliation queue → terminal audited decision', example: `import java.util.*;
final class ReconciliationExample {
  enum Status { PENDING, POSTED, REJECTED, DISCREPANCY }
  static Status reconcile(Status current, Optional<Boolean> externalPosted) {
    // Evidence must be authoritative and matched to this exact operation.
    // false means definitive rejection, never merely absent/pending/not posted.
    // Serialize this pure decision with a version-checked durable owner write.
    if (current == null || externalPosted == null) throw new IllegalArgumentException();
    if (current == Status.POSTED || current == Status.REJECTED) return current;
    if (externalPosted.isEmpty()) return Status.DISCREPANCY;
    return externalPosted.get() ? Status.POSTED : Status.REJECTED;
  }
}`, walkthrough: 'An empty evidence value means unresolved; false means an authoritative definitive rejection for the exact operation, never a pending result or missing lookup. Duplicate matching terminal evidence is harmless. Contradictory late evidence must open a separate discrepancy case without overwriting the original posting. The durable owner applies this pure decision with a version check so stale or concurrent callbacks cannot both finalize. Retain the intent, currency scales, rate, policies, external references, and decisions under the applicable retention policy.', exercise: 'Define matching key, evidence source, owner, escalation age, terminal decisions, and safe metric dimensions for an unresolved card charge.', quiz: 'Why is matching by amount and timestamp unsafe?', answer: 'Different customers can share amount and nearby time, and clocks or settlements vary. Stable operation and provider references bind evidence to one intended effect without guessing.' },
];
