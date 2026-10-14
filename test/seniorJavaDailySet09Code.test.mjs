import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 9 published window and feed pass independent oracles and concurrent ownership checks", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-09.md", import.meta.url), "utf8");
  const examples = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(examples.length, 2, "compile every published Java block");
  const checks = `
    static int assertions;
    static void check(boolean condition) {
      assertions++;
      if (!condition) throw new AssertionError("check " + assertions);
    }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable failure) { check(type.isInstance(failure)); return; }
      throw new AssertionError("expected " + type);
    }
    // Directly inspect every subarray: independent of sliding-window/deque invariants.
    static int windowOracle(int[] input, int limit) {
      int best = 0;
      for (int start = 0; start < input.length; start++) {
        for (int end = start; end < input.length; end++) {
          long low = input[start], high = input[start];
          for (int i = start; i <= end; i++) { low = Math.min(low,input[i]); high = Math.max(high,input[i]); }
          if (high - low <= limit) best = Math.max(best, end-start+1);
        }
      }
      return best;
    }
    static void windowChecks() {
      for (int length = 0; length <= 8; length++) {
        int cases = 1;
        for (int i = 0; i < length; i++) cases *= 3;
        for (int code = 0; code < cases; code++) {
          int[] input = new int[length]; int remainder = code;
          for (int i = 0; i < length; i++) { input[i] = remainder % 3 - 1; remainder /= 3; }
          int[] copy = input.clone();
          for (int limit : new int[]{-1,0,1,2,Integer.MAX_VALUE})
            check(longestWithinLimit(input,limit) == windowOracle(input,limit));
          check(Arrays.equals(input,copy));
        }
      }
      for (int[] input : List.of(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE},
            new int[]{Integer.MIN_VALUE,-1,0,Integer.MAX_VALUE}, new int[]{8,2,4,7},
            new int[]{10,1,2,4,7,2}, new int[]{4,4,4,1,1,4,4})) {
        for (int limit : new int[]{0,3,4,5,Integer.MAX_VALUE})
          check(longestWithinLimit(input,limit) == windowOracle(input,limit));
      }
      int[] large = new int[100000]; Arrays.fill(large,7);
      check(longestWithinLimit(large,0) == large.length);
      for (int i = 0; i < large.length; i++) large[i] = i;
      check(longestWithinLimit(large,100) == 101);
      rejects(NullPointerException.class, () -> longestWithinLimit(null,4));
    }
    // Independently select the next best eligible post by a full scan; no sorting strategy.
    static List<NewsFeed.Post> feedOracle(List<NewsFeed.Post> history, boolean[][] follows,
                                         int actor, int limit, NewsFeed.Ranking ranking,
                                         Set<Long> muted, String topic) {
      List<NewsFeed.Post> result = new ArrayList<>();
      while (result.size() < limit) {
        NewsFeed.Post best = null;
        for (NewsFeed.Post post : history) {
          if (result.contains(post) || muted.contains(post.author())) continue;
          if (post.author() != actor && !follows[actor][(int)post.author()]) continue;
          if (topic != null && !topic.equals(post.topic())) continue;
          if (best == null || (ranking == NewsFeed.Ranking.LIKED && post.likes() > best.likes())
              || ((ranking == NewsFeed.Ranking.NEWEST || post.likes() == best.likes()) && post.id() > best.id())) best = post;
        }
        if (best == null) break;
        result.add(best);
      }
      return result;
    }
    static void feedChecks() throws Exception {
      NewsFeed feed = new NewsFeed();
      check(feed.feed(1,10,NewsFeed.Ranking.NEWEST,Set.of(),null).isEmpty());
      feed.follow(1,2); feed.follow(1,2); feed.follow(1,1);
      var older = feed.post(2,"java","older",10);
      var newer = feed.post(1,"design","newer",10);
      var unrelated = feed.post(3,"java","other",100);
      check(feed.feed(1,10,NewsFeed.Ranking.LIKED,Set.of(),null).equals(List.of(newer,older)));
      check(feed.feed(1,10,NewsFeed.Ranking.NEWEST,Set.of(),"java").equals(List.of(older)));
      check(feed.feed(1,10,NewsFeed.Ranking.NEWEST,Set.of(2L),null).equals(List.of(newer)));
      var snapshot = feed.feed(1,10,NewsFeed.Ranking.NEWEST,Set.of(),null);
      feed.unfollow(1,2); feed.unfollow(1,2); feed.unfollow(1,1);
      check(feed.feed(1,10,NewsFeed.Ranking.NEWEST,Set.of(),null).equals(List.of(newer)));
      check(snapshot.equals(List.of(newer,older)));
      rejects(UnsupportedOperationException.class, () -> snapshot.add(unrelated));
      check(feed.feed(1,0,NewsFeed.Ranking.NEWEST,Set.of(),null).isEmpty());
      rejects(IllegalArgumentException.class, () -> feed.follow(0,1));
      rejects(IllegalArgumentException.class, () -> feed.unfollow(1,-1));
      rejects(IllegalArgumentException.class, () -> feed.post(1,"java"," ",0));
      rejects(IllegalArgumentException.class, () -> feed.post(1," ","text",0));
      rejects(IllegalArgumentException.class, () -> feed.post(1,"java","text",-1));
      rejects(NullPointerException.class, () -> feed.post(1,null,"text",0));
      rejects(NullPointerException.class, () -> feed.post(1,"java",null,0));
      rejects(IllegalArgumentException.class, () -> feed.feed(1,-1,NewsFeed.Ranking.NEWEST,Set.of(),null));
      rejects(NullPointerException.class, () -> feed.feed(1,10,null,Set.of(),null));
      rejects(NullPointerException.class, () -> feed.feed(1,10,NewsFeed.Ranking.NEWEST,null,null));
      // Mixed graph transitions, scores, ties, filters and limits, with an independent graph/history.
      NewsFeed oracleFeed = new NewsFeed(); boolean[][] graph = new boolean[5][5];
      List<NewsFeed.Post> history = new ArrayList<>(); Random random = new Random(9031);
      for (int step = 0; step < 500; step++) {
        int actor = 1 + random.nextInt(4), author = 1 + random.nextInt(4);
        switch (random.nextInt(3)) {
          case 0 -> { oracleFeed.follow(actor,author); if (actor != author) graph[actor][author] = true; }
          case 1 -> { oracleFeed.unfollow(actor,author); graph[actor][author] = false; }
          default -> history.add(oracleFeed.post(author,random.nextBoolean() ? "java" : "design","post"+step,random.nextInt(3)));
        }
        for (var ranking : NewsFeed.Ranking.values()) {
          Set<Long> muted = random.nextBoolean() ? Set.of((long)author) : Set.of();
          String topic = random.nextBoolean() ? "java" : null; int limit = random.nextInt(8);
          check(oracleFeed.feed(actor,limit,ranking,muted,topic).equals(feedOracle(history,graph,actor,limit,ranking,muted,topic)));
        }
      }
      NewsFeed concurrent = new NewsFeed();
      for (int author = 2; author <= 5; author++) concurrent.follow(1,author);
      var pool = java.util.concurrent.Executors.newFixedThreadPool(4);
      var start = new java.util.concurrent.CountDownLatch(1);
      List<java.util.concurrent.Future<?>> tasks = new ArrayList<>();
      try {
        for (int author = 2; author <= 5; author++) {
          final int owner = author;
          tasks.add(pool.submit(() -> { start.await(); for (int i = 0; i < 100; i++) concurrent.post(owner,"java","post"+i,1); return null; }));
        }
        start.countDown();
        for (var task : tasks) task.get(10,java.util.concurrent.TimeUnit.SECONDS);
        var result = concurrent.feed(1,1000,NewsFeed.Ranking.NEWEST,Set.of(),null);
        check(result.size() == 400);
        for (int i = 0; i < result.size(); i++) check(result.get(i).id() == 400-i);
        for (int author = 2; author <= 5; author++) {
          final int owner = author; check(result.stream().filter(post -> post.author() == owner).count() == 100);
        }
      } finally { start.countDown(); pool.shutdownNow(); }
    }
    static void libraryChecks() throws Exception {
      var unbounded = new java.util.concurrent.ThreadPoolExecutor(10,50,1,java.util.concurrent.TimeUnit.SECONDS,
          new java.util.concurrent.LinkedBlockingQueue<>());
      var entered = new java.util.concurrent.CountDownLatch(10);
      var release = new java.util.concurrent.CountDownLatch(1);
      try {
        for (int i = 0; i < 15; i++) unbounded.execute(() -> {
          entered.countDown();
          try { release.await(); } catch (InterruptedException failure) { Thread.currentThread().interrupt(); }
        });
        check(entered.await(5,java.util.concurrent.TimeUnit.SECONDS));
        check(unbounded.getPoolSize() == 10); check(unbounded.getQueue().size() == 5);
      } finally { release.countDown(); unbounded.shutdownNow(); }
      List<Integer> frozen = java.util.stream.Stream.of(1,2).toList();
      rejects(UnsupportedOperationException.class, () -> frozen.add(3));
      List<Integer> mutable = java.util.stream.Stream.of(1,2).collect(java.util.stream.Collectors.toCollection(ArrayList::new));
      mutable.add(3); check(mutable.equals(List.of(1,2,3)));
      Long smallA = Long.valueOf(127), smallB = Long.valueOf(127);
      check(smallA == smallB);
      // Explicit distinct objects expose identity mistakes without relying on optional cache extensions.
      @SuppressWarnings("removal") Long largeA = new Long(1000);
      @SuppressWarnings("removal") Long largeB = new Long(1000);
      check(largeA != largeB); check(Objects.equals(largeA,largeB)); check(!Objects.equals(largeA,null));
      List<Integer> invalid = new ArrayList<>(List.of(1,2,3));
      rejects(ConcurrentModificationException.class, () -> { for (int value : invalid) if (value == 1) invalid.remove(Integer.valueOf(value)); });
      List<Integer> valid = new ArrayList<>(List.of(1,2,3,4));
      for (Iterator<Integer> it = valid.iterator(); it.hasNext();) if (it.next()%2 == 0) it.remove();
      check(valid.equals(List.of(1,3)));
      Exception body = new Exception("body"), closed = new Exception("close");
      try (AutoCloseable resource = () -> { throw closed; }) { throw body; }
      catch (Exception failure) { check(failure == body); check(Arrays.equals(failure.getSuppressed(),new Throwable[]{closed})); }
      Exception firstClose = new Exception("first"), secondClose = new Exception("second");
      List<String> closedOrder = new ArrayList<>();
      try (AutoCloseable first = () -> { closedOrder.add("first"); throw firstClose; };
           AutoCloseable second = () -> { closedOrder.add("second"); throw secondClose; }) { }
      catch (Exception failure) { check(failure == secondClose); check(Arrays.equals(failure.getSuppressed(),new Throwable[]{firstClose})); }
      check(closedOrder.equals(List.of("second","first")));
    }
    public static void main(String[] args) throws Exception {
      windowChecks(); feedChecks(); libraryChecks();
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set09-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet09Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet09Checks {\n${examples.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet09Checks"], { timeout: 30000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/); console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
