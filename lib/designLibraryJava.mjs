// Published, standalone Java 17 invariant models. Each is compiled and exercised by designLibraryJava.test.mjs.
const model = (name, body, checks, limits) => ({ name, source: `import java.util.*;\n\npublic class ${name} {\n${body}\n}\n`, checks, limits });
export const DESIGN_JAVA_MODELS = {
  'parking-lot': model('ParkingLot', `  public record Ticket(String spot, String vehicle, long session) {}
  private final Map<String, Ticket> occupied = new HashMap<>();
  private long generation;
  public synchronized Ticket park(String spot, String vehicle) {
    if (spot == null || spot.isBlank() || vehicle == null || vehicle.isBlank()) throw new IllegalArgumentException();
    if (occupied.containsKey(spot) || occupied.values().stream().anyMatch(t -> t.vehicle().equals(vehicle))) return null;
    long session = Math.incrementExact(generation);
    Ticket ticket = new Ticket(spot, vehicle, session);
    occupied.put(spot, ticket); generation = session; return ticket;
  }
  public synchronized boolean leave(Ticket ticket) {
    Objects.requireNonNull(ticket);
    return occupied.remove(ticket.spot(), ticket);
  }`, `ParkingLot p = new ParkingLot(); ParkingLot.Ticket first=p.park("A", "car1"); check(first!=null); check(p.park("A", "car2")==null); check(p.park("B", "car1")==null); check(!p.leave(new ParkingLot.Ticket("A","car2",first.session()))); check(p.leave(first)); check(!p.leave(first)); ParkingLot.Ticket second=p.park("A","car1"); check(second!=null); check(!p.leave(first)); check(p.park("A","car2")==null); check(p.leave(second)); reject(() -> p.park(null,"car"));`,
  'Single-process occupancy core for already validated compatible spots. park returns a session ticket, or null when the spot/vehicle is occupied; leave requires that exact session. Tickets are not authentication credentials. Allocation, pricing, persistence and cross-process locking are not implemented. park is O(n) in occupied spots; sessions must remain unique across restarts in a durable implementation.'),
  'elevator': model('ElevatorStops', `  private final int floors;
  private final NavigableSet<Integer> stops = new TreeSet<>();
  public ElevatorStops(int floors) { if (floors < 1) throw new IllegalArgumentException(); this.floors = floors; }
  public synchronized void request(int floor) {
    if (floor < 0 || floor >= floors) throw new IllegalArgumentException(); stops.add(floor);
  }
  public synchronized Integer next(int current, boolean up) {
    if (current < 0 || current >= floors) throw new IllegalArgumentException();
    Integer next = up ? stops.ceiling(current) : stops.floor(current);
    if (next == null) next = up ? stops.floor(current) : stops.ceiling(current);
    if (next != null) stops.remove(next); return next;
  }`, `ElevatorStops e = new ElevatorStops(10); check(e.next(0,true)==null); e.request(2); e.request(2); e.request(8); check(e.next(5,true)==8); check(e.next(8,true)==2); check(e.next(2,false)==null); reject(() -> e.request(10)); reject(() -> new ElevatorStops(0));`,
  'A synchronized stop-selection model, O(log n) per request/selection. Selection consumes a stop immediately; a physical elevator needs assigned/in-flight/served states, safety interlocks, door sensors and retry recovery. It is not a real-time elevator controller.'),
  'library': model('LibraryLoans', `  public record Loan(String copy, String member, long session) {}
  private final Map<String, Loan> loans = new HashMap<>();
  private long generation;
  public synchronized Loan borrow(String copy, String member) {
    if (copy == null || copy.isBlank() || member == null || member.isBlank()) throw new IllegalArgumentException();
    if (loans.containsKey(copy)) return null;
    long session = Math.incrementExact(generation);
    Loan loan = new Loan(copy, member, session);
    loans.put(copy, loan); generation = session; return loan;
  }
  public synchronized boolean giveBack(Loan loan) {
    Objects.requireNonNull(loan);
    return loans.remove(loan.copy(), loan);
  }`, `LibraryLoans l = new LibraryLoans(); LibraryLoans.Loan first=l.borrow("copy1","m1"); check(first!=null); check(l.borrow("copy1","m2")==null); check(l.borrow("copy2","m2")!=null); check(!l.giveBack(new LibraryLoans.Loan("copy1","m2",first.session()))); check(l.giveBack(first)); check(!l.giveBack(first)); LibraryLoans.Loan second=l.borrow("copy1","m1"); check(second!=null); check(!l.giveBack(first)); check(l.borrow("copy1","m2")==null); check(l.giveBack(second)); reject(() -> l.borrow("", "m1"));`,
  'Single-process loan ownership core, average O(1) per operation. borrow returns a session loan or null when occupied; giveBack compares the complete loan so an old return cannot close a later loan to the same member. Authentication, catalog validation, renewals, reservations, due dates, fines and persistence are outside this core. Durable loan identities must survive process restarts.'),
  'vending-machine': model('VendingTransaction', `  private final long price;
  private long credit;
  private boolean dispensed, cancelled;
  public VendingTransaction(long price) { if (price <= 0) throw new IllegalArgumentException(); this.price = price; }
  public synchronized void insert(long coins) {
    if (coins <= 0) throw new IllegalArgumentException();
    if (dispensed || cancelled) throw new IllegalStateException();
    credit = Math.addExact(credit, coins);
  }
  public synchronized long dispense() {
    if (dispensed || cancelled || credit < price) throw new IllegalStateException();
    dispensed = true; long change = credit - price; credit = 0; return change;
  }
  public synchronized long cancel() {
    if (dispensed) throw new IllegalStateException();
    cancelled = true; long refund = credit; credit = 0; return refund;
  }`, `VendingTransaction v = new VendingTransaction(50); stateReject(v::dispense); v.insert(70); check(v.dispense()==20); stateReject(v::dispense); stateReject(v::cancel); VendingTransaction c = new VendingTransaction(10); c.insert(5); check(c.cancel()==5); check(c.cancel()==0); stateReject(() -> c.insert(10)); stateReject(c::dispense); reject(() -> c.insert(-1));`,
  'O(1) accounting for one purchase in integer minor units. Cancellation is terminal; repeated cancellation returns zero and cannot refund twice. This assumes successful physical dispensing and available change; hardware acknowledgments, product inventory, denomination inventory and payment-provider reconciliation require the full state machine.'),
  'expense-sharing': model('ExpenseSplit', `  public static long[] equalShares(long minor, int members) {
    if (minor < 0 || members < 1 || members > 10000) throw new IllegalArgumentException();
    long[] shares = new long[members]; long base = minor / members, remainder = minor % members;
    for (int i = 0; i < members; i++) shares[i] = base + (i < remainder ? 1 : 0);
    return shares;
  }`, `check(Arrays.equals(ExpenseSplit.equalShares(10,3),new long[]{4,3,3})); check(Arrays.equals(ExpenseSplit.equalShares(0,2),new long[]{0,0})); check(ExpenseSplit.equalShares(Long.MAX_VALUE,1)[0]==Long.MAX_VALUE); reject(() -> ExpenseSplit.equalShares(-1,2)); reject(() -> ExpenseSplit.equalShares(1,0)); reject(() -> ExpenseSplit.equalShares(1,10001));`,
  'O(members) time and space; deterministic equal splitting only. Input member order decides remainder allocation and must be stable. Currency, payer validation, immutable expense posting, settlement and idempotency are not implemented.'),
  'seat-reservation': model('SeatHold', `  private String owner;
  private long expiresAt;
  private long generation;
  private boolean confirmed;
  public synchronized long hold(String holder, long now, long ttl) {
    if (holder == null || holder.isBlank() || now < 0 || ttl <= 0) throw new IllegalArgumentException();
    if (confirmed || (owner != null && now < expiresAt)) return -1;
    long expiry = Math.addExact(now, ttl), token = Math.incrementExact(generation);
    owner = holder; expiresAt = expiry; generation = token; return token;
  }
  public synchronized boolean confirm(String holder, long token, long now) {
    if (holder == null || now < 0) throw new IllegalArgumentException();
    if (confirmed || !holder.equals(owner) || token != generation || now >= expiresAt) return false;
    confirmed = true; return true;
  }`, `SeatHold s = new SeatHold(); long a = s.hold("a",0,10); check(a>0); check(s.hold("b",9,10)==-1); long b = s.hold("b",10,10); check(b>a); check(!s.confirm("a",a,11)); check(!s.confirm("b",a,11)); check(s.confirm("b",b,11)); check(s.hold("c",30,10)==-1); SeatHold x = new SeatHold(); long t=x.hold("a",0,10); check(!x.confirm("a",t,10)); reject(() -> x.hold(null,0,1));`,
  'O(1) single-seat, single-process ownership model with injected nondecreasing time. confirm assumes the caller already verified payment. Payment states, cancellation/refunds, atomic multi-seat acquisition, persistence and cross-process fencing are outside this class.'),
  'lru-cache': model('LruCache', `  private final int capacity;
  private final LinkedHashMap<String, String> entries = new LinkedHashMap<>(16, .75f, true);
  public LruCache(int capacity) { if (capacity < 1) throw new IllegalArgumentException(); this.capacity = capacity; }
  public synchronized String get(String key) { return entries.get(Objects.requireNonNull(key)); }
  public synchronized void put(String key, String value) {
    Objects.requireNonNull(key); Objects.requireNonNull(value); entries.put(key, value);
    if (entries.size() > capacity) entries.remove(entries.keySet().iterator().next());
  }`, `LruCache c = new LruCache(2); c.put("a","1"); c.put("b","2"); check("1".equals(c.get("a"))); c.put("c","3"); check(c.get("b")==null); c.put("a","new"); check("new".equals(c.get("a"))); c.put("d","4"); check(c.get("c")==null); reject(() -> new LruCache(0)); nullReject(() -> c.put("x",null));`,
  'Average O(1) get/put and O(capacity) entries. One monitor protects access-order mutations, including get. No TTL, byte budget, loading, expiration callbacks or distributed coherence is included.'),
  'rate-limiter': model('RollingQuota', `  private final int limit; private final long window;
  private long previous; private final Deque<Long> accepted = new ArrayDeque<>();
  public RollingQuota(int limit, long window) {
    if (limit < 1 || window < 1) throw new IllegalArgumentException(); this.limit = limit; this.window = window;
  }
  public synchronized boolean allow(long now) {
    if (now < previous) throw new IllegalArgumentException(); previous = now;
    while (!accepted.isEmpty() && now - accepted.peekFirst() >= window) accepted.removeFirst();
    if (accepted.size() >= limit) return false;
    accepted.addLast(now); return true;
  }`, `RollingQuota q = new RollingQuota(1,10); check(q.allow(0)); check(!q.allow(9)); check(q.allow(10)); check(!q.allow(10)); check(q.allow(Long.MAX_VALUE)); reject(() -> q.allow(-1)); reject(() -> new RollingQuota(0,1));`,
  'One identity in one process, using nonnegative nondecreasing times. Admission covers (now − window, now]. O(1) amortized time and O(limit) memory; one cleanup call may remove O(limit) entries. Multi-identity eviction and shared distributed quotas are not implemented.'),
  'task-scheduler': model('JobLease', `  private long generation;
  private long expiry;
  private boolean done;
  public synchronized long claim(long now, long ttl) {
    if (now < 0 || ttl <= 0) throw new IllegalArgumentException();
    if (done || now < expiry) return -1;
    long until = Math.addExact(now, ttl), token = Math.incrementExact(generation);
    expiry = until; generation = token; return token;
  }
  public synchronized boolean complete(long token, long now) {
    if (now < 0) throw new IllegalArgumentException();
    if (done || token <= 0 || token != generation || now >= expiry) return false;
    done = true; return true;
  }`, `JobLease j = new JobLease(); check(!j.complete(0,0)); long a=j.claim(0,10); check(j.claim(9,10)==-1); long b=j.claim(10,10); check(b>a); check(!j.complete(a,11)); check(j.complete(b,11)); check(!j.complete(b,12)); check(j.claim(30,10)==-1); reject(() -> new JobLease().claim(0,0));`,
  'O(1) single-job lease fencing with nondecreasing injected time. It guards completion state only; it cannot undo or deduplicate external side effects. Durable claiming, retries, cancellation, heartbeats and business-operation deduplication remain separate.'),
  'notification-router': model('ChannelRegistry', `  public interface Sender { void send(String message); }
  private final Map<String, Sender> senders;
  public ChannelRegistry(Map<String, Sender> senders) { this.senders = Map.copyOf(senders); }
  public void send(String channel, String message) {
    if (channel == null || message == null || message.isBlank()) throw new IllegalArgumentException();
    Sender sender = senders.get(channel);
    if (sender == null) throw new IllegalArgumentException("Unsupported channel");
    sender.send(message);
  }`, `List<String> sent=new ArrayList<>(); Map<String,ChannelRegistry.Sender> m=new HashMap<>(); m.put("email",sent::add); ChannelRegistry r=new ChannelRegistry(m); m.clear(); r.send("email","hello"); check(sent.equals(List.of("hello"))); reject(() -> r.send("sms","hello")); reject(() -> r.send("email"," "));`,
  'Average O(1) routing over an immutable registry. The registry is safely shareable, but Sender implementations own their thread safety. Real dispatch needs preferences, durable commands, timeouts, idempotency and bounded provider retries.'),
  'board-game': model('TicTacToe', `  private final char[] board = new char[9];
  private char turn = 'X'; private boolean finished;
  public synchronized char play(int cell, char player) {
    if (cell < 0 || cell >= 9 || (player != 'X' && player != 'O')) throw new IllegalArgumentException();
    if (finished || player != turn || board[cell] != 0) throw new IllegalStateException();
    board[cell] = player;
    int[][] lines={{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};
    for (int[] line : lines) if (board[line[0]]==player && board[line[1]]==player && board[line[2]]==player) { finished=true; return player; }
    boolean full=true; for (char c : board) if(c==0) full=false;
    if (full) { finished=true; return 'D'; }
    turn = player == 'X' ? 'O' : 'X'; return '-';
  }`, `TicTacToe g=new TicTacToe(); stateReject(() -> g.play(0,'O')); check(g.play(0,'X')=='-'); stateReject(() -> g.play(0,'O')); g.play(3,'O'); g.play(1,'X'); g.play(4,'O'); check(g.play(2,'X')=='X'); stateReject(() -> g.play(5,'O')); reject(() -> new TicTacToe().play(9,'X')); TicTacToe d=new TicTacToe(); int[] cells={0,1,2,4,3,5,7,6,8}; for(int i=0;i<8;i++) check(d.play(cells[i], i%2==0?'X':'O')=='-'); check(d.play(8,'X')=='D');`,
  'O(1) validation for a fixed 3×3 local game. Multiplayer authentication, persistence, optimistic versions and request deduplication are separate. This is tic-tac-toe, not a chess-rule engine.'),
  'logging-framework': model('LevelLogger', `  public enum Level { DEBUG, INFO, WARN, ERROR }
  public interface Sink { void write(Level level, String message); }
  private final Level minimum; private final List<Sink> sinks;
  public LevelLogger(Level minimum, List<Sink> sinks) {
    this.minimum=Objects.requireNonNull(minimum); this.sinks=List.copyOf(sinks);
  }
  public void log(Level level, String message) {
    Objects.requireNonNull(level); Objects.requireNonNull(message);
    if (level.ordinal() < minimum.ordinal()) return;
    String safe = message.replace('\\n',' ').replace('\\r',' ');
    for (Sink sink : sinks) sink.write(level, safe);
  }`, String.raw`List<String> rows=new ArrayList<>(); LevelLogger l=new LevelLogger(LevelLogger.Level.INFO,List.of((level,message)->rows.add(level+":"+message))); l.log(LevelLogger.Level.DEBUG,"hidden"); l.log(LevelLogger.Level.ERROR,"a\nb"); check(rows.equals(List.of("ERROR:a b"))); nullReject(() -> l.log(null,"x"));`,
  'O(number of sinks + message length) synchronous dispatch. Sink failures propagate; sinks own concurrency and I/O lifecycle. Newline removal is only line-boundary hygiene, not secret redaction or comprehensive log sanitization. Async queues, structured fields and retention are outside this model.'),
};
