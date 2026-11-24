const title = 'The browser disconnected. Why is your Java AI stream still running?';

export const JAVA_AI_STREAMING_BLOG = {
  id: 'java-ai-stream-cancellation',
  title,
  category: 'Java and AI engineering',
  javaRelease: 17,
  authorUrl: 'https://medium.com/@sagarkrris',
  sourceUrl: 'https://spring.io/blog/2026/11/20/spring-ai-2-1-0-GA-available-now/',
  references: [
    ['HTML Standard: Server-Sent Events and Last-Event-ID', 'https://html.spec.whatwg.org/multipage/server-sent-events.html'],
    ['JDK 21 HttpClient: streaming bodies and cancellation', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html'],
  ],
  summary: 'Follow one model response from admission to disconnect. Learn how to budget stream time, hold scarce capacity until local cleanup, and recover without duplicating a partial response.',
  lessons: [
    'Distinguish first output, idle time and the total deadline.',
    'Keep each local upstream permit with the producer that owns it.',
    'Separate transport reconnect from a new, potentially billable generation.',
  ],
  sections: [
    {
      heading: 'The answer stopped displaying. The work did not.',
      body: 'Imagine an assistant that starts answering immediately. The user closes the tab after two tokens. The browser connection ends, but the upstream model call and its response reader may still be alive. Free the capacity slot at disconnect and a second user can now start work on a slot that was never free. Retry the original request through a reconnect and the first user might get two answers or pay for two attempts.',
    },
    {
      heading: 'Why this matters now',
      body: 'Spring AI 2.1 arrived on November 20, 2026. Its release is a current example of the Java ecosystem building more AI infrastructure. The lifecycle problem below applies across streaming integrations. It is a design exercise, and the release does not establish how frequently any particular application encounters these failures.',
    },
    {
      heading: 'Read the three lifetimes separately',
      body: 'The browser owns its connection. The service owns the local upstream attempt and its resource cleanup. The provider owns remote generation and billing. A closed browser connection proves only that the downstream side ended. A closed local response body lets the service account for its local capacity. Provider-side termination and charge settlement require their own evidence.',
    },
    {
      heading: 'What the examples verify',
      body: 'These runnable Java 17 decision models use no framework, credentials or live model. They check budget arithmetic, atomic local admission, cancellation races and retry eligibility. Use the HTML Standard section on Server-Sent Events to verify browser framing and reconnection behavior, and the JDK HttpClient API to verify what the selected client promises about cancellation and closing a streaming body.',
    },
  ],
  example: 'Browser connection → local model stream and capacity slot → upstream provider\nBrowser disconnect → request cancellation → producer cleanup → release local slot',
  interviewQuestions: [
    'Which timeout should stop a model that sends a token often enough to avoid idle expiry?',
    'When may a cancelled stream return its local capacity slot?',
    'When could a reconnect start a duplicate generation?',
  ],
  practice: 'Trace one success, one silent provider and one disconnect after partial output. Name who can confirm each terminal state and what the next caller sees.',
  capstone: {
    title: 'Build a bounded streaming endpoint with a fake model provider',
    scenario: 'A Java chat endpoint permits two active upstream attempts. One user disconnects after receiving partial output while the fake provider delays cleanup. A synchronized burst requests more capacity.',
    steps: [
      'Configure a first-output budget, an idle budget and a total request deadline. Have the fake provider delay the first token, stall after a token, and emit steady tokens until the total deadline.',
      'Hold the permit while the producer unwinds. Use duplicate and concurrent completion callbacks in a test, and assert that a new request can start only when a slot actually returns.',
      'Close the downstream connection after partial output and attempt a reconnect. Assert that this does not start another generation. Define separate telemetry for cancellation requested, local cleanup finished and unknown remote outcome.',
    ],
    outcome: 'Measure admission refusals, time to first output, stream duration and cancellation-to-cleanup latency. In a live integration, separately verify the provider’s cancellation, replay and billing contract.',
  },
};

export const JAVA_AI_STREAMING_CHAPTERS = [
  {
    title: '1. A model stream needs three clocks',
    lesson: 'First-output time measures how long useful content takes to appear. Idle time measures a gap between useful output events. The total deadline caps the request even when tokens keep arriving. A server-sent event heartbeat can keep a transport alive without delivering a model token, so it must not reset a model-progress budget. Start the end-to-end clock before admission or preprocessing.',
    walkthrough: 'Assume an illustrative total budget of 8,000 ms, first-output budget of 2,000 ms, and idle budget of 1,000 ms after useful output. At 7,850 ms of total elapsed time, only 150 ms remains even if the last token arrived just now. The timeout passed to the next wait must be at most 150 ms.',
    whenToUse: 'Use distinct clocks for streams whose useful output may arrive late or stop between events.',
    avoid: 'Avoid resetting the total deadline when a retry starts or treating keepalive traffic as model progress.',
    diagram: 'request starts → first useful output → subsequent useful output → terminal state\n       |________________________ total deadline ________________________|',
    example: `final class ModelStreamBudget {
  static long remainingMillis(long total, long phaseLimit,
      long elapsedTotal, long elapsedPhase) {
    if (total <= 0 || phaseLimit <= 0 || elapsedTotal < 0
        || elapsedPhase < 0 || elapsedPhase > elapsedTotal) {
      throw new IllegalArgumentException("Invalid stream clock");
    }
    return Math.max(0, Math.min(total - elapsedTotal, phaseLimit - elapsedPhase));
  }
  // Calculate elapsed durations with a monotonic clock. Select the first-output
  // limit before useful output, then the idle limit after it.
}`,
    exercise: 'Trace a silent connection with HTTP heartbeats, a provider stalled between chunks and a stream that emits continuously until the total deadline.',
    quiz: 'Why should a stream that sends a token every 500 ms eventually time out?',
    answer: 'Tokens can prevent idle expiry, while the total request deadline still applies. Base every subsequent wait on the earlier of phase expiry and total expiry.',
  },
  {
    title: '2. Give each upstream attempt one local permit',
    lesson: 'An inexpensive virtual thread or asynchronous callback still represents work competing for network, buffers and model capacity. Acquire a slot before creating upstream work. For this example admission fails fast and has no waiting queue. The producer owns the slot until local cleanup is complete. A failed setup may release its slot immediately only when it has not started work requiring cleanup.',
    walkthrough: 'Two requests consume both slots. A third receives overload immediately. When an active producer closes, it returns its lease once. A duplicate terminal callback cannot increase the limit. A per-process gate does not impose a quota across multiple instances.',
    whenToUse: 'Use fail-fast admission for a shared upstream dependency when waiting inside this service offers little value.',
    avoid: 'Avoid acquiring after issuing the transport request, releasing on first token, or turning an unbounded queue into a hidden deadline extension.',
    diagram: 'admit slot → start attempt → stream output → close local resources → release slot\nover limit → reject before starting upstream work',
    example: `import java.util.Optional;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;

final class ModelStreamAdmission {
  private final Semaphore permits;

  ModelStreamAdmission(int capacity) {
    if (capacity < 1) throw new IllegalArgumentException("Capacity must be positive");
    permits = new Semaphore(capacity);
  }

  Optional<Lease> tryOpen() {
    return permits.tryAcquire() ? Optional.of(new Lease()) : Optional.empty();
  }

  final class Lease implements AutoCloseable {
    private final AtomicBoolean closed = new AtomicBoolean();

    @Override public void close() {
      if (closed.compareAndSet(false, true)) permits.release();
    }
  }
}`,
    exercise: 'Use a one-slot service and have two callers enter simultaneously. Confirm one is rejected, then deliver the first caller’s terminal notification twice.',
    quiz: 'Does a pool of virtual threads enforce a service’s upstream concurrency limit?',
    answer: 'No. The work limit belongs at admission, before the provider call. Count the active upstream work the process owns, and coordinate separately if the limit must span replicas.',
  },
  {
    title: '3. A disconnect requests cancellation',
    lesson: 'When the reader disconnects, stop sending output and signal cancellation to the producer. Treat that signal as a request. Finish the local attempt only after the response body, subscription or other local resources have unwound. Java’s default HTTP client attempts to cancel an exchange when its cancellable future is cancelled. This does not prove when the underlying exchange stops or how the provider accounts for it.',
    walkthrough: 'A user closes the tab while the service is reading. The cancellation callback requests termination and the attempt becomes CANCELLING. The service can still reject a competing request because that slot remains occupied. The producer closes its local body and then reports completion. The same attempt’s cancellation and terminal paths may race.',
    whenToUse: 'Use a producer-owned cleanup path any time a local downstream connection can end before upstream work.',
    avoid: 'Avoid returning a slot in a browser disconnect callback or treating a local stop as proof that billing or remote generation stopped.',
    diagram: 'browser closes → signal this attempt → producer closes local body → release slot\n                          provider outcome stays separate',
    example: `import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

final class ModelStreamCancellation {
  private enum State { OPEN, CANCELLING, FINISHED }

  private final AtomicReference<State> state = new AtomicReference<>(State.OPEN);
  private final ModelStreamAdmission.Lease lease;
  private final Runnable cancelTransport;

  ModelStreamCancellation(ModelStreamAdmission.Lease lease, Runnable cancelTransport) {
    this.lease = Objects.requireNonNull(lease);
    this.cancelTransport = Objects.requireNonNull(cancelTransport);
  }

  void readerDisconnected() {
    if (state.compareAndSet(State.OPEN, State.CANCELLING)) cancelTransport.run();
  }

  void localProducerFinished() {
    if (state.getAndSet(State.FINISHED) != State.FINISHED) lease.close();
  }
  // Signal targets this attempt only and can race with producer completion.
  // If signalling throws, the caller reports it; cleanup still owns the lease.
}`,
    exercise: 'Force cancellation signalling to fail, delay producer cleanup and deliver duplicate completion callbacks. Prove capacity returns only after cleanup.',
    quiz: 'What can you conclude when a cancelled request returns its local permit?',
    answer: 'Local resources for that attempt were cleaned up. The permit records local capacity, while provider termination and billing still need their own evidence.',
  },
  {
    title: '4. Reconnects and retries have different contracts',
    lesson: 'Native EventSource can reconnect, and an event ID can help resume delivery if the server has retained the corresponding events. It does not create retained history or hold the model run open by itself. A new provider call is a new execution. After output may be visible, this example forbids transparent replay. Even before output, a timeout can hide provider acceptance.',
    walkthrough: 'Before public output, allow at most one retry of a known rejection or of an ambiguous attempt protected by a provider contract that deduplicates the same request and scoped key within its retention window. The remaining budget must cover the delay and a minimum useful attempt. After the first write may have reached the user, return a terminal state when possible or resume the same persisted event log. Do not silently append a new answer to the old one.',
    whenToUse: 'Apply this decision immediately before any transport retry or browser reconnection can start new upstream work.',
    avoid: 'Avoid retrying after output was possibly sent, assuming no output means no provider work, or ignoring a server-supplied backoff deadline.',
    diagram: 'reconnect → same attempt and retained cursor → replay eligible events\nnew attempt → no visible output + safe evidence + enough time → start at most once',
    example: `final class ModelStreamReplay {
  enum Evidence { REJECTED_BEFORE_WORK, UNKNOWN }

  static boolean retry(boolean outputMayBeVisible, boolean alreadyRetried,
      Evidence evidence, boolean providerDeduplicates, long remaining,
      long delay, long minimumAttempt) {
    if (evidence == null || remaining < 0 || delay < 0 || minimumAttempt <= 0) {
      throw new IllegalArgumentException("Invalid retry decision");
    }
    boolean safe = evidence == Evidence.REJECTED_BEFORE_WORK || providerDeduplicates;
    return !outputMayBeVisible && !alreadyRetried && safe
        && delay < remaining && minimumAttempt <= remaining - delay;
  }
}`,
    exercise: 'Reproduce a lost first token, a browser reconnect after visible output, and a provider rejection whose backoff would consume the remaining budget.',
    quiz: 'Does Last-Event-ID authorize another model invocation?',
    answer: 'No. It identifies the client’s last observed event for a potential resume. The server must authorize access and decide whether it can replay retained events from the same run.',
  },
].map(chapter => ({ ...chapter, authoredPractice: true }));
