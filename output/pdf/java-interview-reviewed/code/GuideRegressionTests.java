import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.math.BigDecimal;
import java.time.Duration;

public final class GuideRegressionTests {
    private static int checks;
    @FunctionalInterface interface Checked { void run() throws Exception; }
    static void check(boolean condition) { checks++; if (!condition) throw new AssertionError("check " + checks); }
    static void throwsType(Class<? extends Throwable> type, Checked action) throws Exception {
        checks++;
        try { action.run(); } catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("Expected " + type + ", got " + t, t);
        }
        throw new AssertionError("Expected " + type);
    }
    static void await(CountDownLatch latch) throws Exception {
        if (!latch.await(5, TimeUnit.SECONDS)) throw new AssertionError("latch timeout");
    }
    static void join(Thread thread) throws Exception {
        thread.join(5000);
        if (thread.isAlive()) { thread.interrupt(); throw new AssertionError("thread did not terminate"); }
    }
    static void uncheckedAwait(CountDownLatch latch) {
        try { if (!latch.await(5, TimeUnit.SECONDS)) throw new AssertionError("timeout"); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new RuntimeException(e); }
    }
    public static void main(String[] args) throws Exception {
        ranking(); limiter(); pool(); producerConsumer(); retry(); collections(); algorithms();
        System.out.println("PASS: " + checks + " review regression checks");
    }
    static void ranking() {
        var input=List.of(new GuideExamples.Ranking.Employee(3,"C","D",new BigDecimal("100.00")),
                new GuideExamples.Ranking.Employee(1,"A","D",new BigDecimal("100")),
                new GuideExamples.Ranking.Employee(2,"B","D",new BigDecimal("90")),
                new GuideExamples.Ranking.Employee(4,"E","D",new BigDecimal("80")));
        check(GuideExamples.Ranking.top3(input).get("D").stream().map(GuideExamples.Ranking.Employee::id)
                .toList().equals(List.of(1L,3L,2L)));
        check(GuideExamples.Ranking.top3(List.of()).isEmpty());
    }
    static void limiter() throws Exception {
        AtomicLong now=new AtomicLong();
        var b=new GuideExamples.S2.TokenBucket(2,1,now::get);
        check(b.tryAcquire()); check(b.tryAcquire()); check(!b.tryAcquire());
        now.set(999_999_999L); check(!b.tryAcquire()); now.set(1_000_000_000L); check(b.tryAcquire());
        now.set(100_000_000_000L); check(b.tryAcquire()); check(b.tryAcquire()); check(!b.tryAcquire());
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S2.TokenBucket(0,1));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S2.TokenBucket(2,0));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S2.TokenBucket(2,Double.NaN));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S2.TokenBucket(2,Double.POSITIVE_INFINITY));
        now.set(-1); throwsType(IllegalStateException.class,b::tryAcquire);
        var concurrent=new GuideExamples.S2.TokenBucket(3,1,()->0L);
        try (var exec=Executors.newFixedThreadPool(8)) {
            var results=new ArrayList<Future<Boolean>>();
            for(int i=0;i<80;i++) results.add(exec.submit(concurrent::tryAcquire));
            int success=0; for(var f:results) if(f.get(5,TimeUnit.SECONDS)) success++;
            check(success==3);
        }
        AtomicLong wrap=new AtomicLong(Long.MAX_VALUE-500_000_000L);
        var rollover=new GuideExamples.S2.TokenBucket(1,1,wrap::get); check(rollover.tryAcquire());
        wrap.addAndGet(1_000_000_000L); check(rollover.tryAcquire());
    }
    static void pool() throws Exception {
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S36.MiniPool(0));
        var p=new GuideExamples.S36.MiniPool(1,1);
        CountDownLatch entered=new CountDownLatch(1), release=new CountDownLatch(1);
        var first=p.submit(()->{entered.countDown();uncheckedAwait(release);}); await(entered);
        AtomicInteger done=new AtomicInteger(); var queued=p.submit(done::incrementAndGet);
        throwsType(RejectedExecutionException.class,()->p.submit(()->{}));
        release.countDown(); p.close(); first.get(); queued.get(); check(done.get()==1);
        throwsType(RejectedExecutionException.class,()->p.submit(()->{})); p.close();
        try(var failures=new GuideExamples.S36.MiniPool(1)) {
            var bad=failures.submit(()->{throw new IllegalArgumentException("task");});
            throwsType(ExecutionException.class,()->bad.get(5,TimeUnit.SECONDS));
            failures.submit(done::incrementAndGet).get(5,TimeUnit.SECONDS); check(done.get()==2);
            var self=failures.submit(()->{
                try { failures.close(); } catch(InterruptedException e) {throw new AssertionError(e);}
            });
            throwsType(ExecutionException.class,()->self.get(5,TimeUnit.SECONDS));
        }
        for(int i=0;i<100;i++) {
            var raced=new GuideExamples.S36.MiniPool(1,2);
            CountDownLatch gate=new CountDownLatch(1);
            AtomicReference<Future<?>> accepted=new AtomicReference<>();
            AtomicReference<Throwable> error=new AtomicReference<>();
            AtomicInteger effects=new AtomicInteger();
            Thread submitter=new Thread(()->{
                uncheckedAwait(gate);
                try {accepted.set(raced.submit(effects::incrementAndGet));}
                catch(RejectedExecutionException expected){}
                catch(Throwable t){error.set(t);}
            });
            Thread closer=new Thread(()->{uncheckedAwait(gate);try{raced.close();}catch(Throwable t){error.set(t);}});
            submitter.start();closer.start();gate.countDown();join(submitter);join(closer);
            check(error.get()==null);
            if(accepted.get()!=null){accepted.get().get(5,TimeUnit.SECONDS);check(effects.get()==1);}
            else check(effects.get()==0);
        }
    }
    static void producerConsumer() throws Exception {
        List<Integer> received=new ArrayList<>(); ProducerConsumerDemo.run(20,received::add);
        check(received.size()==20); check(received.get(0)==1);check(received.get(19)==20);
        ProducerConsumerDemo.run(0,v->{throw new AssertionError();}); check(true);
        throwsType(IllegalArgumentException.class,()->ProducerConsumerDemo.run(-1,v->{}));
        // A failing consumer must also stop a producer blocked on the bounded queue.
        try(var owner=Executors.newSingleThreadExecutor()) {
            var f=owner.submit(()->{ProducerConsumerDemo.run(10000,v->{throw new IllegalStateException("consumer failed");});return null;});
            throwsType(ExecutionException.class,()->f.get(5,TimeUnit.SECONDS));
        }
        CountDownLatch inCallback=new CountDownLatch(1), cancelled=new CountDownLatch(1);
        AtomicReference<Throwable> outcome=new AtomicReference<>();
        Thread owner=new Thread(()->{
            try {ProducerConsumerDemo.run(10000,v->{
                inCallback.countDown();
                try {new CountDownLatch(1).await();}
                catch(InterruptedException e){Thread.currentThread().interrupt();cancelled.countDown();throw new RuntimeException(e);}
            });outcome.set(new AssertionError("expected interruption"));}
            catch(Throwable t){outcome.set(t);}
        });
        owner.start();await(inCallback);owner.interrupt();join(owner);await(cancelled);
        check(outcome.get() instanceof InterruptedException);
    }
    static void retry() throws Exception {
        AtomicInteger attempts=new AtomicInteger();
        int v=GuideExamples.S5.retry(()->{if(attempts.incrementAndGet()<3)throw new Exception("transient");return 7;},3,1,2,e->true);
        check(v==7);check(attempts.get()==3);
        throwsType(IllegalArgumentException.class,()->GuideExamples.S5.retry(()->1,0,1,2,e->true));
        throwsType(IllegalArgumentException.class,()->GuideExamples.S5.retry(()->1,1,0,2,e->true));
        throwsType(IllegalArgumentException.class,()->GuideExamples.S5.retry(()->1,1,1,Long.MAX_VALUE,e->true));
        attempts.set(0);
        throwsType(InterruptedException.class,()->GuideExamples.S5.retry(()->{attempts.incrementAndGet();throw new InterruptedException();},3,1,2,e->true));
        check(attempts.get()==1);
        attempts.set(0);
        throwsType(Exception.class,()->GuideExamples.S5.retry(()->{attempts.incrementAndGet();throw new Exception();},3,1,2,e->false));
        check(attempts.get()==1);
    }
    static void collections() throws Exception {
        var lru=new GuideExamples.S1.LRUCache<String,Integer>(2);lru.put("a",1);lru.put("b",2);lru.get("a");lru.put("c",3);
        check(!lru.containsKey("b"));check(lru.size()==2);
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S1.LRUCache<>(0));
        var q=new GuideExamples.S10.BoundedQueue<Integer>(2);q.put(1);q.put(2);check(q.take()==1);q.put(3);check(q.take()==2);check(q.take()==3);
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S10.BoundedQueue<>(0));
        throwsType(NullPointerException.class,()->q.put(null));
        var cache=new GuideExamples.S35.TtlCache<String,Integer>(Duration.ofMinutes(1));AtomicInteger loads=new AtomicInteger();
        check(cache.get("a",k->loads.incrementAndGet())==1);check(cache.get("a",k->loads.incrementAndGet())==1);check(loads.get()==1);
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S35.TtlCache<>(Duration.ZERO));
        throwsType(NullPointerException.class,()->cache.get("b",k->null));
        ArrayList<String> stops=new ArrayList<>(List.of("a"));var plan=new GuideExamples.S52.DeliveryPlan(stops);stops.add("b");check(plan.stops().size()==1);
        throwsType(UnsupportedOperationException.class,()->plan.stops().add("c"));
    }
    static void algorithms() throws Exception {
        check(new GuideExamples.S3().lengthOfLongestSubstring("abba")==2);
        check(new HashSet<>(new GuideExamples.S6().topK(new int[]{1,1,2},1)).equals(Set.of(1)));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S6().topK(new int[]{1},-1));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S6().topK(new int[]{1},2));
        check(new GuideExamples.S6().topK(new int[]{1},0).isEmpty());
        check(new GuideExamples.S7().groupAnagrams(new String[]{"eat","tea","bat"}).size()==2);
        check(GuideExamples.S8.describe(new GuideExamples.S8.Success<>(4)).equals("OK: 4"));
        check(new GuideExamples.S13().search(new int[]{4,5,1,2,3},2)==3);
        check(new GuideExamples.S15().isValid("([])"));check(!new GuideExamples.S15().isValid("([)]"));
        check(new GuideExamples.S16().numIslands(new char[][]{{'1','0'},{'0','1'}})==2);
        check(new GuideExamples.S17().coinChange(new int[]{1,2,5},11)==3);
        check(new GuideExamples.S17().coinChange(new int[]{2},3)==-1);
        check(new GuideExamples.S17().coinChange(new int[]{},0)==0);
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S17().coinChange(new int[]{0},4));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S17().coinChange(new int[]{-1},4));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S17().coinChange(new int[]{1},Integer.MAX_VALUE));
        check(new GuideExamples.S39().longestConsecutive(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE})==1);
        check(Arrays.equals(new GuideExamples.S40().productExceptSelf(new int[]{1,2,3,4}),new int[]{24,12,8,6}));
        check(new GuideExamples.S41().orangesRotting(new int[][]{{2,1,1},{1,1,0},{0,1,1}})==4);
        check(new GuideExamples.S42().trap(new int[]{0,1,0,2,1,0,1,3,2,1,2,1})==6);
        check(new GuideExamples.S43().minWindow("ADOBECODEBANC","ABC").equals("BANC"));
        check(new GuideExamples.S46().lengthOfLIS(new int[]{10,9,2,5,3,7,101,18})==4);
        check(new GuideExamples.S47().canPartition(new int[]{1,5,11,5}));
        throwsType(IllegalArgumentException.class,()->new GuideExamples.S47().canPartition(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE}));
        check(new GuideExamples.S48().longestCommonSubsequence("abcde","ace")==3);
        check(new GuideExamples.S49().ladderLength("hit","cog",List.of("hot","dot","dog","lot","log","cog"))==5);
        check(new GuideExamples.S50().findCheapestPrice(3,new int[][]{{0,1,100},{1,2,100},{0,2,500}},0,2,1)==200);
        check(Arrays.equals(new GuideExamples.S51().findRedundantConnection(new int[][]{{1,2},{1,3},{2,3}}),new int[]{2,3}));
        Random random=new Random(20261007);
        for(int trial=0;trial<1000;trial++) {
            int n=1+random.nextInt(30);int[] values=new int[n];for(int i=0;i<n;i++)values[i]=random.nextInt(11)-5;
            int k=1+random.nextInt(n);int[] sorted=values.clone();Arrays.sort(sorted);
            check(new GuideExamples.S14().kthLargest(values,k)==sorted[n-k]);
            check(GuideExamples.S56.kthLargest(values,k)==sorted[n-k]);
            int distinct=random.nextInt(6),best=0;
            for(int start=0;start<n;start++) {Set<Integer> seen=new HashSet<>();for(int end=start;end<n;end++){seen.add(values[end]);if(seen.size()<=distinct)best=Math.max(best,end-start+1);}}
            check(GuideExamples.S55.longestAtMostKDistinct(values,distinct)==best);
        }
        check(GuideExamples.S54.buildOrder(3,new int[][]{{0,1},{1,2}}).equals(List.of(0,1,2)));
        throwsType(IllegalArgumentException.class,()->GuideExamples.S54.buildOrder(2,new int[][]{{0,1},{1,0}}));
        var intervals=List.of(new GuideExamples.S53.Interval(1,2),new GuideExamples.S53.Interval(2,3));
        check(GuideExamples.S53.merge(intervals).equals(List.of(new GuideExamples.S53.Interval(1,3))));
    }
}
