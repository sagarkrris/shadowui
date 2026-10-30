import { ADVANCED_COMPREHENSION_EXERCISES } from './advancedComprehensionExercises.mjs';

// Full Java 17 snippets. The behavioral fixture compiles these published strings.
const exercise = (lesson, starter, reference) => ({ ...lesson, javaRelease: 17, starter, reference });

export const JAVA_COMPREHENSION_EXERCISES = [
  exercise({
    id: 'array-boundary', title: 'Why does adding three numbers throw an exception?', level: 'Beginner',
    goal: 'Read a loop and distinguish a count from a valid array position.',
    question: 'The method should add every number. Predict sum(new int[] {2, 3, 4}), explain every iteration, and repair the smallest incorrect expression.',
    contract: 'The array must not be null. Empty arrays return 0. Values and their total fit in a Java int. The method must leave the array unchanged.',
    vocabulary: [['Array', 'An ordered group of values. An array of length 3 has positions 0, 1 and 2.'], ['Index', 'The position used to read an array element. numbers[i] reads the value at position i.'], ['Exception', 'A signal that normal execution stopped because an operation could not complete.']],
    explanation: ['int total = 0 creates the running sum. The variable i starts at position 0.', 'The middle part of the for loop is checked before each iteration. i++ increases i by one after the body finishes.', 'numbers.length is the number of elements, not the last valid position. For three elements, numbers[3] does not exist.'],
    sample: 'Exercise.sum(new int[] {2, 3, 4})', expected: '9', actual: 'ArrayIndexOutOfBoundsException, after total has reached 9',
    trace: [['i = 0', '0 <= 3 is true; read numbers[0] = 2', 'total becomes 2'], ['i = 1', '1 <= 3 is true; read numbers[1] = 3', 'total becomes 5'], ['i = 2', '2 <= 3 is true; read numbers[2] = 4', 'total becomes 9'], ['i = 3', '3 <= 3 is true; read numbers[3]', 'Exception: there is no fourth element']],
    flow: [['Input', 'Three values: 2, 3, 4; length is 3.'], ['Read valid positions', 'Positions 0, 1 and 2 add up to 9.'], ['Faulty extra iteration', 'The <= condition allows position 3.'], ['Correct boundary', 'Use i < numbers.length; stop before position 3.']],
    fix: 'Change <= to <. The corrected loop visits exactly the valid positions. An empty array has length 0, so its body never runs and the result stays 0.',
    tests: ['Empty array → 0; one element [7] → 7.', '[2, 3, 4] → 9; [-2, 3] → 1.', 'Null is rejected, and the input array is unchanged.'],
    spoken: 'The method initializes a running sum and visits array positions in order. For [2, 3, 4], the first three iterations produce 9, but the condition also permits i = 3. That position is outside the array, so the method throws instead of returning. I would use i < numbers.length, then verify empty, single-element and negative-value cases. The method makes one pass and uses a fixed amount of extra storage. I am assuming the total fits in int; if that assumption changes, the numeric contract also needs to change.',
    followUp: ['Would changing the result to long solve every overflow problem?', 'It increases the supported range, but it does not make arbitrary totals safe. Change the accumulator and return type together, define accepted input limits, and test the new boundaries. For this exercise the int bound is explicit, so the loop fix is sufficient.'],
    deepDive: 'With n elements, the corrected loop performs n additions: O(n) time and O(1) auxiliary space. O(1) means the extra storage does not grow with n. An enhanced for loop is also valid, but changing the comparison is the smallest repair. The exception is deterministic; catching it would hide a boundary defect rather than repair the calculation.',
    aiTrap: 'An assistant may suggest catching ArrayIndexOutOfBoundsException and returning the partial total. That turns an invalid access into normal control flow and makes other indexing mistakes harder to detect. Repair the boundary instead.',
    sources: [['Java array access and bounds checks', 'https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html#jls-15.10.4']],
  }, `import java.util.Objects;

public class Exercise {
  public static int sum(int[] numbers) {
    Objects.requireNonNull(numbers, "numbers");
    int total = 0;
    for (int i = 0; i <= numbers.length; i++) {
      total += numbers[i];
    }
    return total;
  }
}`, `import java.util.Objects;

public class Exercise {
  public static int sum(int[] numbers) {
    Objects.requireNonNull(numbers, "numbers");
    int total = 0;
    for (int i = 0; i < numbers.length; i++) {
      total += numbers[i];
    }
    return total;
  }
}`),
  exercise({
    id: 'string-value', title: 'Why are two copies of PAID treated differently?', level: 'Beginner',
    goal: 'Separate object identity from equal text, and handle a missing value deliberately.',
    question: 'A payment status arrives as new String("PAID"). Should isPaid return true? Explain why testing only the literal "PAID" can hide the bug.',
    contract: 'PAID is a stable, case-sensitive protocol code, not translated display text. Exactly that text means paid. Null, empty text and other codes mean false.',
    vocabulary: [['Reference', 'A value that identifies an object. Two references can identify different objects containing the same text.'], ['== on objects', 'Checks whether both references identify the same object, or are both null.'], ['equals', 'String.equals compares the characters in two strings.']],
    explanation: ['The parameter status refers to a String object, or is null.', 'The == expression compares identity, so it does not answer whether the incoming characters spell PAID.', 'Java can share identical string literals through interning. A test using only the literal may pass accidentally; new String("PAID") deliberately supplies a different object.'],
    sample: 'Exercise.isPaid(new String("PAID"))', expected: 'true', actual: 'false',
    trace: [['Create incoming text', 'new String("PAID") creates a different object', 'Characters are P A I D'], ['Compare with ==', 'Incoming object is not the literal object', 'false'], ['Compare with equals', 'The characters match', 'true'], ['Try null', '"PAID".equals(null) is defined', 'false; no null dereference']],
    flow: [['Input', 'A new String containing PAID.'], ['Wrong question', 'Are these the very same object?'], ['Correct question', 'Do the characters equal the protocol code PAID?'], ['Missing input', 'Compare from the non-null literal so null means false.']],
    fix: 'Call "PAID".equals(status). The known literal is non-null, so this expression also implements the required null behavior. Calling status.equals("PAID") would throw when status is null.',
    tests: ['The literal "PAID" and new String("PAID") both return true.', 'Null, "", "paid" and "PENDING" return false.'],
    spoken: 'The bug is that == compares String references, while the requirement is about text. Literal-only tests can hide it because Java may reuse the same literal object. A newly constructed PAID string proves the difference. I would use "PAID".equals(status), which checks characters and safely returns false for null. I would test separately allocated equal text, null, empty text and a different code. I would keep case sensitivity because the contract defines an exact protocol code.',
    followUp: ['Why not use equalsIgnoreCase or convert everything to uppercase?', 'That changes the accepted inputs. It might be appropriate at a documented parsing boundary, but it is not implied by this requirement. For a closed set of states, parsing into an enum can make invalid codes explicit; the parser still needs a defined missing-value and unknown-code policy.'],
    deepDive: 'Identity and value equality are both useful, but they answer different questions. Strings are immutable, meaning their characters do not change after construction. Comparing values does not require copying or modifying either string. This exercise uses a fixed four-character code; comparing arbitrary strings can require examining their characters.',
    aiTrap: 'Interning every incoming string can make reference comparisons appear to work, but it hides the intended value comparison and introduces a global string-pool concern. Express the requirement directly with equals.',
    sources: [['String.equals', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/String.html#equals(java.lang.Object)'], ['Reference equality', 'https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html#jls-15.21.3']],
  }, `public class Exercise {
  public static boolean isPaid(String status) {
    return status == "PAID";
  }
}`, `public class Exercise {
  public static boolean isPaid(String status) {
    return "PAID".equals(status);
  }
}`),
  exercise({
    id: 'boolean-rule', title: 'Why can an unverified account receive the email?', level: 'Beginner',
    goal: 'Translate a plain-language rule into a condition and verify all combinations.',
    question: 'An account may receive a sensitive email only if it is active AND its address is verified. Evaluate all four input combinations before editing shouldEmail.',
    contract: 'Both inputs are primitive booleans, so neither is null. Both conditions must be true. This method only decides eligibility; it does not send email or authorize access to an account.',
    vocabulary: [['Boolean', 'A value that is either true or false.'], ['|| (OR)', 'True when at least one condition is true.'], ['&& (AND)', 'True only when both conditions are true.']],
    explanation: ['active represents whether the account is enabled. verified represents whether the email address has been confirmed.', 'The current expression accepts either condition by itself. An active but unverified account therefore passes.', 'The word AND in the requirement means that one successful check cannot compensate for the other failing.'],
    sample: 'Exercise.shouldEmail(true, false)', expected: 'false', actual: 'true',
    trace: [['active=false, verified=false', 'false || false', 'Actual false; expected false'], ['active=false, verified=true', 'false || true', 'Actual true; expected false'], ['active=true, verified=false', 'true || false', 'Actual true; expected false'], ['active=true, verified=true', 'true || true', 'Actual true; expected true']],
    flow: [['Account state', 'Check whether the account is active.'], ['Address state', 'Check whether the address is verified.'], ['Combine the rules', 'Both must be true: active && verified.'], ['Decision', 'Every other combination returns false.']],
    fix: 'Replace || with &&. This makes the expression match the stated rule. Writing a four-row truth table exposes both incorrect mixed cases rather than testing only the all-true and all-false cases.',
    tests: ['Test all four boolean combinations.', 'Only (true, true) is accepted; both mixed cases are rejected.'],
    spoken: 'The requirement contains two necessary conditions: the account must be active and its email must be verified. The current OR condition accepts either condition on its own. For example, true and false produces true, allowing an unverified address. I would replace OR with AND and verify the full truth table. This function is a pure decision with no side effects; actual authorization and sending still belong to their own workflow.',
    followUp: ['Could I replace || with a single & instead?', 'For boolean operands, & also computes AND, but it evaluates both sides. && stops after a false left side. That distinction matters when a later expression dereferences an object or performs work. Here both inputs are already booleans, but && states the normal conditional intent clearly.'],
    deepDive: 'A truth table lists every combination of boolean inputs and its output. Two inputs require four rows, so exhaustive testing is practical. Short-circuit evaluation means the second expression may not run. Do not hide required side effects inside conditions that may be skipped. Real eligibility should also be checked against the correct account and current state at the relevant boundary.',
    aiTrap: 'An assistant may rewrite the expression using negation and introduce another logic error. Check its proposed condition against all four rows instead of judging how compact it looks.',
    sources: [['Conditional AND and OR', 'https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html#jls-15.23']],
  }, `public class Exercise {
  public static boolean shouldEmail(boolean active, boolean verified) {
    return active || verified;
  }
}`, `public class Exercise {
  public static boolean shouldEmail(boolean active, boolean verified) {
    return active && verified;
  }
}`),
  exercise({
    id: 'list-ownership', title: 'Why did finding the top scores reorder the original list?', level: 'Intermediate',
    goal: 'Trace shared objects, in-place mutation and a list view.',
    question: 'The caller owns [40, 90, 70]. topTwo should return [90, 70] without changing the caller’s list. After the call, the caller also changes the returned first value to 0. Explain both surprises in the starter.',
    contract: 'Input is a non-null List of non-null Integer values. Return up to two values in descending order, retaining duplicates. Preserve the input, support an unmodifiable input, and return an independent, mutable list.',
    vocabulary: [['Mutation', 'Changing an existing object, such as sorting a list in place.'], ['View', 'A window into another collection rather than an independent copy.'], ['Shallow copy', 'A new container holding the same element references; enough here because Integer values are immutable.']],
    explanation: ['The parameter and caller refer to the same List. sort changes that object rather than producing a new list.', 'subList(0, end) selects positions starting at 0 and ending just before end. It returns a backed view of the sorted list.', 'Copy once before sorting to protect caller order. Copy the selected range again to avoid returning a view into that working list.'],
    sample: `var scores = new ArrayList<Integer>(List.of(40, 90, 70));
var top = Exercise.topTwo(scores);
scores;
top.set(0, 0);
scores;`, expected: 'Result [90, 70]; original stays [40, 90, 70]; changing result does not change original', actual: 'Original becomes [90, 70, 40]; changing result[0] to 0 changes original[0] too',
    trace: [['Before call', 'caller and scores identify the same list', '[40, 90, 70]'], ['sort descending', 'The shared list is rearranged', 'Caller now sees [90, 70, 40]'], ['subList(0, 2)', 'Return a view of the first two positions', 'Result displays [90, 70]'], ['result.set(0, 0)', 'Write through the view', 'Caller now sees [0, 70, 40]']],
    flow: [['Caller-owned input', 'Keep [40, 90, 70] unchanged.'], ['Working copy', 'Copy the list and sort the copy.'], ['Select two', 'Use the smaller of 2 and the list size.'], ['Independent result', 'Copy the selected range into a new list.']],
    fix: 'Create an ArrayList working copy, sort it, then return a new ArrayList containing the selected range. The second copy implements the independent mutable-result contract. It also avoids exposing a view that retains the entire working list.',
    tests: ['Input order stays unchanged; modifying the result does not change the input.', 'An unmodifiable List.of input works.', 'Empty input → []; one score → that score; [7, 7, 3] → [7, 7].'],
    spoken: 'The returned scores look correct, but the method violates ownership. sort mutates the caller’s list, and subList returns a backed view, so changing the result can change that original list too. I would sort a new ArrayList and copy its selected range into another ArrayList. This supports unmodifiable inputs and returns an independent mutable result. I would test original order, result mutation, empty and short lists, and duplicates. The cost is copying and sorting the input; for only two maximum values, a carefully specified one-pass solution could reduce that work.',
    followUp: ['Would copying the list protect mutable Player objects inside it?', 'No. A shallow copy separates the containers, not the objects they contain. Mutating a shared Player would still be visible through both lists. Use immutable result values or explicitly copy the required fields when that isolation is part of the contract. Integer elements do not have that problem.'],
    deepDive: 'For n scores, sorting the working ArrayList takes O(n log n) time in the general case and the copy uses O(n) extra storage. The returned list contains at most two elements. Returning List.copyOf would instead promise an unmodifiable result, so it would not satisfy this particular mutable-result contract. Optimizing to a one-pass top-two calculation must preserve duplicates and the behavior for zero or one element.',
    aiTrap: 'Returning scores.stream().sorted(...).limit(2).toList() avoids input mutation, but Java 17 Stream.toList returns an unmodifiable list. That changes the requested result contract. Check ownership and mutability separately.',
    sources: [['List.subList and sorting', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/List.html#subList(int,int)'], ['ArrayList collection constructor', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/ArrayList.html#%3Cinit%3E(java.util.Collection)'], ['Stream.toList mutability', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/Stream.html#toList()']],
  }, `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class Exercise {
  public static List<Integer> topTwo(List<Integer> scores) {
    Objects.requireNonNull(scores, "scores");
    scores.sort(Comparator.reverseOrder());
    return scores.subList(0, Math.min(2, scores.size()));
  }
}`, `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class Exercise {
  public static List<Integer> topTwo(List<Integer> scores) {
    Objects.requireNonNull(scores, "scores");
    List<Integer> sorted = new ArrayList<>(scores);
    sorted.sort(Comparator.reverseOrder());
    return new ArrayList<>(sorted.subList(0, Math.min(2, sorted.size())));
  }
}`),
  exercise({
    id: 'comparison-overflow', title: 'Why does the largest integer compare as smaller?', level: 'Intermediate',
    goal: 'Distinguish a comparison result from subtraction and recognize integer overflow.',
    question: 'A sorting helper should report whether left is smaller than, equal to, or larger than right. Predict compare(Integer.MAX_VALUE, -1). Does left - right always give the correct sign?',
    contract: 'Accept every Java int, including its minimum and maximum. Return a negative number for smaller, zero for equal, and a positive number for larger. The magnitude of the result has no meaning.',
    vocabulary: [['Comparator result', 'Its sign describes ordering: negative, zero or positive.'], ['Overflow', 'A mathematical result is outside the representable numeric range. Java int arithmetic wraps rather than automatically becoming a wider value.'], ['Integer.MAX_VALUE', 'The largest int: 2,147,483,647.']],
    explanation: ['For small values, subtraction often appears to work: 5 - 2 is positive.', 'The mathematical value 2,147,483,647 - (-1) is 2,147,483,648. That value cannot fit in an int.', 'The wrapped result is -2,147,483,648, a negative number. A sorting algorithm would therefore receive the wrong order.'],
    sample: 'Exercise.compare(Integer.MAX_VALUE, -1)', expected: 'A positive result, because 2,147,483,647 is larger than -1', actual: '-2,147,483,648: a negative result',
    trace: [['Inputs', 'left = 2,147,483,647; right = -1', 'left is mathematically larger'], ['Subtract', 'Mathematical result is 2,147,483,648', 'Outside the int range'], ['Store as int', 'Arithmetic wraps', '-2,147,483,648'], ['Use Integer.compare', 'Compare ordering without subtracting', 'Positive result: 1']],
    flow: [['Inputs', 'Two values anywhere in the int range.'], ['Faulty operation', 'Subtraction can exceed that range.'], ['Wrong signal', 'A wrapped negative result reverses ordering.'], ['Safe comparison', 'Integer.compare produces the correct ordering sign.']],
    fix: 'Use Integer.compare(left, right). It expresses comparison directly without relying on a difference fitting in int.',
    tests: ['Compare every pair from [MIN_VALUE, -1, 0, 1, MAX_VALUE].', 'Equal values return zero; swapping unequal operands reverses the sign.', 'Check increasing triples remain consistently ordered.'],
    spoken: 'A comparator promises an ordering sign, not a numeric distance. Subtraction violates that promise when the difference overflows. MAX_VALUE minus negative one wraps to a negative int even though the left operand is larger. I would use Integer.compare and test minimum, maximum, zero, equal values and reversed pairs. This keeps the comparison constant in time and space and avoids inventing a new numeric policy.',
    followUp: ['Could I cast the result to long?', 'Casting after subtraction is too late: (long) (left - right) widens an already wrapped int. Widening before subtraction avoids this particular overflow, but a comparator still returns int, so narrowing the difference can reintroduce the bug. Integer.compare is the direct solution.'],
    deepDive: 'Sorting relies on a consistent comparator. If a < b and b < c, the comparator must not claim a > c. Boundary tests can expose such inconsistencies. Do not assume a sort will always throw when a comparator is wrong; it may simply return an incorrect order for a particular input.',
    aiTrap: 'Math.abs(left - right) loses the ordering direction and does not reliably repair overflow. Verify the sign for extreme pairs rather than accepting a numeric-looking patch.',
    sources: [['Integer.compare', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Integer.html#compare(int,int)'], ['Integer arithmetic', 'https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html#jls-4.2.2']],
  }, `public class Exercise {
  public static int compare(int left, int right) {
    return left - right;
  }
}`, `public class Exercise {
  public static int compare(int left, int right) {
    return Integer.compare(left, right);
  }
}`),
  exercise({
    id: 'event-order', title: 'Why did an old event replace the latest account state?', level: 'Applied service reasoning',
    goal: 'Follow state across multiple calls and distinguish arrival order from version order.',
    question: 'An event contains an account ID, a version and a full balance snapshot. Account A receives version 5 with balance 500, then version 4 with balance 400. Trace apply twice and decide which state should remain.',
    contract: 'This is a single-threaded, in-memory teaching model. Inputs and account IDs are non-null; versions are positive and monotonic per account. Each event is a complete replacement snapshot, not a balance change. Keep only a strictly newer version. Reject equal-version duplicates, including conflicting payloads, without changing state. Accounts are independent.',
    vocabulary: [['Record', 'A compact Java 17 data carrier. Its generated accessors, such as version(), read the declared values.'], ['Snapshot', 'The full value at a version, rather than an amount to add to a previous value.'], ['Version', 'An ordering number assigned by the source for one account. It is not the event’s arrival time.']],
    explanation: ['The map stores the latest accepted Event under its account ID. Map.get reads the currently stored event.', 'The starter overwrites the map on every call. The last arrival therefore wins, even when its version is older.', 'The corrected method compares the incoming version with the stored version for the same account before writing. Returning false means this event was ignored.'],
    sample: `var state = new java.util.HashMap<String, Exercise.Event>();
Exercise.apply(state, new Exercise.Event("A", 5, 500));
Exercise.apply(state, new Exercise.Event("A", 4, 400));
state.get("A");`, expected: 'A remains version 5, balance 500; second call returns false', actual: 'A becomes version 4, balance 400; second call returns true',
    trace: [['Start', 'No stored event for A', 'Empty map'], ['Receive A / v5 / 500', 'No previous version', 'Store v5; return true'], ['Receive A / v4 / 400', 'Starter writes without comparing', 'Overwrite with v4: incorrect'], ['Correct second call', '4 is not greater than 5', 'Keep v5; return false']],
    flow: [['Incoming snapshot', 'Account A, version 4, balance 400.'], ['Read current state', 'A already has version 5, balance 500.'], ['Compare versions', '4 <= 5, so the event is stale or duplicate.'], ['Preserve newer state', 'Return false and keep version 5.']],
    fix: 'Read the current event and ignore the incoming event when its version is less than or equal to the stored version. If no event exists, accept the first one. Otherwise store only a strictly newer snapshot.',
    tests: ['Newer then older preserves the newer balance.', 'Equal versions, including different balances, leave the first accepted event unchanged.', 'A second account is independent; a newer version for A is accepted.', 'No claim of concurrent safety or crash recovery is made by this fixture.'],
    spoken: 'The method currently makes arrival order authoritative, so a delayed old event can roll the account backward. Because each event is a full snapshot, I would accept it only when its version is strictly greater than the version stored for that account. I would ignore equal versions as duplicates and test older, equal, newer and multiple-account sequences. This is correct for the stated single-threaded model. A concurrent or durable service needs an atomic version check and update; merely using a thread-safe map does not make these separate operations atomic.',
    followUp: ['Would the same fix work if balance meant an amount to add?', 'No. A delta event changes a previous balance. Skipping a missing earlier delta could lose money even when a later version arrives. Delta processing needs a separate ordering, deduplication and recovery contract. The fixture deliberately uses complete snapshots so skipping older versions is valid.'],
    deepDive: 'The get/compare/put sequence is not atomic across threads. Two callers could both read version 3, then write versions 5 and 4 in that order, leaving version 4. A local concurrent implementation can use an appropriate atomic per-key operation; a database implementation needs an atomic conditional update or equivalent transaction/locking rule. Persisted versions, deletion markers, version resets and reconciliation require explicit policies beyond this map model.',
    aiTrap: 'Replacing HashMap with ConcurrentHashMap does not make a separate get followed by put atomic. Ask the assistant to trace two interleaved updates and identify the exact operation that protects the version comparison.',
    sources: [['Map operations', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html'], ['ConcurrentHashMap.compute', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html#compute(K,java.util.function.BiFunction)']],
  }, `import java.util.Map;

public class Exercise {
  public record Event(String accountId, long version, int balance) {}

  public static boolean apply(Map<String, Event> state, Event incoming) {
    state.put(incoming.accountId(), incoming);
    return true;
  }
}`, `import java.util.Map;

public class Exercise {
  public record Event(String accountId, long version, int balance) {}

  public static boolean apply(Map<String, Event> state, Event incoming) {
    Event current = state.get(incoming.accountId());
    if (current != null && incoming.version() <= current.version()) {
      return false;
    }
    state.put(incoming.accountId(), incoming);
    return true;
  }
}`),
  exercise({
    id: 'retry-budget', title: 'Why does a three-attempt retry budget call four times?', level: 'Applied service reasoning',
    goal: 'Count total attempts, preserve the last failure and avoid retrying the wrong exception.',
    question: 'A caller requests at most three total attempts. The action always throws TransientFailure. Count the calls in retry(action, 3), then explain what happens if attempt 3 succeeds.',
    contract: 'The action is non-null and maxAttempts must be at least 1. It counts total calls, including the first call. Only TransientFailure is retryable. Success returns immediately; after exhaustion propagate the last failure object. Other exceptions, including InterruptedException, propagate immediately. No network, delay or production retry policy is implemented.',
    vocabulary: [['Callable<String>', 'A Java interface for a task whose call() method returns text or throws an exception.'], ['TransientFailure', 'The example’s explicit exception type for a failure that may be tried again. It does not classify real network errors.'], ['Attempt versus retry', 'Three total attempts allow the first call plus at most two additional calls.']],
    explanation: ['The method validates its inputs before invoking the action. The loop counter starts at 0.', 'With <= maxAttempts and a budget of 3, the counter takes values 0, 1, 2 and 3: four calls when all fail.', 'A successful call returns immediately. The catch block remembers only the allowed retryable failure; a different exception leaves the method without another call.'],
    sample: `var calls = new java.util.concurrent.atomic.AtomicInteger();
Exercise.retry(() -> {
  throw new Exercise.TransientFailure("attempt " + calls.incrementAndGet());
}, 3);
calls.get();`, expected: '3 calls, then the third TransientFailure is thrown', actual: '4 calls, then the fourth TransientFailure is thrown',
    trace: [['attempt = 0', '0 <= 3; first call fails', 'Remember failure 1'], ['attempt = 1', '1 <= 3; second call fails', 'Remember failure 2'], ['attempt = 2', '2 <= 3; third call fails', 'Remember failure 3'], ['attempt = 3', '3 <= 3; unwanted fourth call', 'Budget is exceeded']],
    flow: [['Budget', 'Three total calls, not three extra retries.'], ['Attempt', 'Invoke the action once.'], ['Classify result', 'Return on success; retry only TransientFailure.'], ['Stop', 'After call 3 fails, throw that failure.']],
    fix: 'Use attempt < maxAttempts. The counters 0, 1 and 2 then represent exactly three allowed calls. Keep the early return and the narrow catch clause; they preserve success and non-retryable failure behavior.',
    tests: ['Immediate success makes one call; success on call 3 returns after three calls.', 'Repeated retryable failure makes exactly the requested number of calls and rethrows the last exception object.', 'A budget of 1 makes one call; zero or negative budgets reject before any call.', 'A different exception or interruption makes one call and propagates unchanged.'],
    spoken: 'The budget is for total attempts, so a zero-based counter must be strictly less than maxAttempts. With <= and a budget of three, the method calls at counters zero through three, which is four calls. I would change that boundary and retain the immediate return on success. I would test call counts, final exception identity, invalid budgets and success on the last allowed call. Only the explicitly retryable exception should be retried; interruption and other failures must propagate. A real remote operation also needs a safe repetition policy, deadlines and backoff.',
    followUp: ['Is retrying a failed payment safe after fixing the loop?', 'Not automatically. The payment may have succeeded even though the response was lost. Repeating it can charge twice. Use a durable idempotency contract or reconcile the outcome before repeating the side effect. A local attempt-count test cannot establish that remote guarantee.'],
    deepDive: 'A retry budget limits amplification: how much extra work one request can create. This immediate loop models call counting only. Production retries usually need a total deadline, a maximum delay, backoff with jitter and a carefully classified failure policy. Backoff means increasing delay between attempts; jitter varies it to reduce synchronized retry bursts. Preserve cancellation and interruption rather than treating them as ordinary transient errors.',
    aiTrap: 'Catching Exception and returning a fallback string can report success after all attempts failed. Catching every exception and retrying can also swallow interruption or repeat permanent errors. Check call count and failure identity, not just a final happy-path string.',
    sources: [['Callable contract', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Callable.html'], ['for-statement execution', 'https://docs.oracle.com/javase/specs/jls/se17/html/jls-14.html#jls-14.14.1']],
  }, `import java.util.Objects;
import java.util.concurrent.Callable;

public class Exercise {
  public static class TransientFailure extends Exception {
    public TransientFailure(String message) { super(message); }
  }

  public static String retry(Callable<String> action, int maxAttempts)
      throws Exception {
    Objects.requireNonNull(action, "action");
    if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts");
    TransientFailure last = null;
    for (int attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        return action.call();
      } catch (TransientFailure failure) {
        last = failure;
      }
    }
    throw last;
  }
}`, `import java.util.Objects;
import java.util.concurrent.Callable;

public class Exercise {
  public static class TransientFailure extends Exception {
    public TransientFailure(String message) { super(message); }
  }

  public static String retry(Callable<String> action, int maxAttempts)
      throws Exception {
    Objects.requireNonNull(action, "action");
    if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts");
    TransientFailure last = null;
    for (int attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return action.call();
      } catch (TransientFailure failure) {
        last = failure;
      }
    }
    throw last;
  }
}`),
  exercise({
    id: 'permit-cleanup', title: 'Why does one failed task make every later task look busy?', level: 'Applied service reasoning',
    goal: 'Track resource ownership through success, exceptions and overlapping calls.',
    question: 'A semaphore starts with one permit. The first task throws IllegalStateException. Trace the permit count and explain why the next task is rejected by the starter.',
    contract: 'The semaphore and Runnable are non-null. A Runnable is synchronous work: its run() method finishes or throws before this method ends. Acquire one permit without waiting, reject if none is available, and release exactly the acquired permit on success or failure. Preserve the work’s exception.',
    vocabulary: [['Semaphore', 'A concurrency tool that maintains a count of available permits. A permit represents permission to enter limited work.'], ['tryAcquire()', 'Attempts to take one permit immediately and reports whether it succeeded.'], ['finally', 'A block that runs when normal Java control leaves its try block, including through a thrown exception.']],
    explanation: ['Both arguments are validated before taking capacity. A failed acquisition throws Busy and must not release anything.', 'After a successful acquisition, the available count drops from 1 to 0. The method now owns one release obligation.', 'In the starter, a work exception skips permits.release(). The count stays 0 even though that task has ended.'],
    sample: `var permits = new java.util.concurrent.Semaphore(1);
Exercise.runWithPermit(permits, () -> {
  throw new IllegalStateException("task failed");
});
permits.availablePermits();`, expected: 'The original failure propagates; one permit is available for the next task', actual: 'The original failure propagates; zero permits remain and the next task is rejected',
    trace: [['Start', 'One permit available', 'Capacity = 1'], ['Acquire', 'tryAcquire returns true', 'Capacity = 0'], ['Run task', 'work.run throws', 'Normal statements below it are skipped'], ['Starter cleanup', 'release is never reached', 'Capacity stays 0: a leak'], ['Correct cleanup', 'finally releases the acquired permit', 'Capacity returns to 1']],
    flow: [['Validate and acquire', 'Take one permit only if capacity is available.'], ['Run synchronous work', 'The task can succeed or throw.'], ['Always finish ownership', 'finally releases the acquired permit.'], ['Preserve outcome', 'Return normally or propagate the original failure.']],
    fix: 'Wrap only the acquired work in try/finally and release in finally. Acquisition stays before that try block. This placement prevents releasing a permit that was never acquired.',
    tests: ['Success and failure both restore the original permit count.', 'Busy calls do not run work and do not increase capacity.', 'Null work is rejected before acquiring.', 'A controlled two-caller test rejects overlap while a task owns the only permit, then permits later work.'],
    spoken: 'The method acquires capacity and then releases it only on the success path. If work throws, execution skips the release and the semaphore permanently appears full. I would put the work in try/finally after successful acquisition and release exactly once in finally. I would keep acquisition outside that try so rejection cannot over-release capacity. I would verify success, failure, rejection and overlapping calls, and check that the original exception propagates. The guarantee covers synchronous Java execution; it is not recovery from process termination.',
    followUp: ['What if work starts an asynchronous task and returns immediately?', 'Then returning from work no longer means the protected activity has finished. This finally would release too early. Define ownership over the asynchronous task’s completion and release once when that task truly finishes, including failure and cancellation. That needs a different API and completion-order tests.'],
    deepDive: 'Cleanup is about ownership, not simply placing a release somewhere in finally. Semaphore permits have no built-in owner, and an extra release can increase capacity incorrectly. Also avoid returning or throwing a different exception from finally, because that can replace the work’s original result or failure. A terminated process cannot rely on a finally block for external recovery; durable jobs require their own reconciliation design.',
    aiTrap: 'Moving both acquisition and work inside a try with an unconditional release in finally can release capacity after a rejected acquisition. Test the busy path and the permit count, not only successful cleanup.',
    sources: [['Semaphore acquisition and release', 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Semaphore.html'], ['try/finally execution', 'https://docs.oracle.com/javase/specs/jls/se17/html/jls-14.html#jls-14.20.2']],
  }, `import java.util.Objects;
import java.util.concurrent.Semaphore;

public class Exercise {
  public static void runWithPermit(Semaphore permits, Runnable work) {
    Objects.requireNonNull(permits, "permits");
    Objects.requireNonNull(work, "work");
    if (!permits.tryAcquire()) throw new IllegalStateException("Busy");
    work.run();
    permits.release();
  }
}`, `import java.util.Objects;
import java.util.concurrent.Semaphore;

public class Exercise {
  public static void runWithPermit(Semaphore permits, Runnable work) {
    Objects.requireNonNull(permits, "permits");
    Objects.requireNonNull(work, "work");
    if (!permits.tryAcquire()) throw new IllegalStateException("Busy");
    try {
      work.run();
    } finally {
      permits.release();
    }
  }
}`),
  ...ADVANCED_COMPREHENSION_EXERCISES,
];
