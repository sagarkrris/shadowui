import java.util.*;

/** Eight interview patterns with executable checks. Requires Java 17+; verified on Java 21. */
public final class InterviewAlgorithms {
    private InterviewAlgorithms() {}

    // 1. Binary search. Precondition: a is sorted ascending. Returns a.length if absent above all values.
    public static int lowerBound(int[] a, int target) {
        Objects.requireNonNull(a);
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    // 2. Prefix sums. Counts nonempty subarrays; negative numbers and zero are supported.
    public static long countSubarraysWithSum(int[] a, long target) {
        Objects.requireNonNull(a);
        Map<Long, Long> counts = new HashMap<>();
        counts.put(0L, 1L);
        long prefix = 0, result = 0;
        for (int value : a) {
            prefix += value;
            result += counts.getOrDefault(prefix - target, 0L);
            counts.merge(prefix, 1L, Long::sum);
        }
        return result;
    }

    // 3. Monotonic stack. Equal temperatures do not count as warmer.
    public static int[] daysUntilWarmer(int[] temperatures) {
        Objects.requireNonNull(temperatures);
        int[] result = new int[temperatures.length];
        Deque<Integer> unresolved = new ArrayDeque<>();
        for (int i = 0; i < temperatures.length; i++) {
            while (!unresolved.isEmpty()
                    && temperatures[i] > temperatures[unresolved.peek()]) {
                int previous = unresolved.pop();
                result[previous] = i - previous;
            }
            unresolved.push(i);
        }
        return result;
    }

    // 4. Weighted graph. Directed adjacency list, nodes 0..V-1, nonnegative int weights.
    public record Edge(int to, int weight) {}
    private record State(int node, long distance) {}

    public static long[] shortestPaths(List<List<Edge>> graph, int source) {
        Objects.requireNonNull(graph);
        Objects.checkIndex(source, graph.size());
        for (List<Edge> edges : graph) {
            Objects.requireNonNull(edges);
            for (Edge edge : edges) {
                Objects.requireNonNull(edge);
                Objects.checkIndex(edge.to(), graph.size());
                if (edge.weight() < 0) throw new IllegalArgumentException("Negative edge weight");
            }
        }
        long[] distance = new long[graph.size()];
        Arrays.fill(distance, Long.MAX_VALUE);
        distance[source] = 0;
        PriorityQueue<State> queue = new PriorityQueue<>(Comparator.comparingLong(State::distance));
        queue.add(new State(source, 0));
        while (!queue.isEmpty()) {
            State current = queue.remove();
            if (current.distance() != distance[current.node()]) continue;
            for (Edge edge : graph.get(current.node())) {
                long candidate = current.distance() + edge.weight();
                if (candidate < distance[edge.to()]) {
                    distance[edge.to()] = candidate;
                    queue.add(new State(edge.to(), candidate));
                }
            }
        }
        return distance;
    }

    // 5. Disjoint sets. Mutable and single-threaded; union returns false for an existing connection.
    public static final class DisjointSet {
        private final int[] parent, size;
        private int components;

        public DisjointSet(int n) {
            if (n < 0) throw new IllegalArgumentException("Negative size");
            parent = new int[n];
            size = new int[n];
            components = n;
            for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        }

        public int find(int node) {
            Objects.checkIndex(node, parent.length);
            while (node != parent[node]) {
                parent[node] = parent[parent[node]];
                node = parent[node];
            }
            return node;
        }

        public boolean union(int a, int b) {
            int rootA = find(a), rootB = find(b);
            if (rootA == rootB) return false;
            if (size[rootA] < size[rootB]) { int tmp = rootA; rootA = rootB; rootB = tmp; }
            parent[rootB] = rootA;
            size[rootA] += size[rootB];
            components--;
            return true;
        }

        public int components() { return components; }
    }

    // 6. Dynamic programming. Unit-cost insert/delete/replace over UTF-16 code units.
    public static int editDistance(String a, String b) {
        Objects.requireNonNull(a);
        Objects.requireNonNull(b);
        if (a.length() < b.length()) { String tmp = a; a = b; b = tmp; }
        int[] previous = new int[b.length() + 1], current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) previous[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                current[j] = a.charAt(i - 1) == b.charAt(j - 1)
                    ? previous[j - 1]
                    : 1 + Math.min(previous[j - 1], Math.min(previous[j], current[j - 1]));
            }
            int[] tmp = previous; previous = current; current = tmp;
        }
        return previous[b.length()];
    }

    // 7. Backtracking. Unique combinations, unlimited reuse, positive candidates, nonnegative target.
    public static List<List<Integer>> combinationSum(int[] candidates, int target) {
        Objects.requireNonNull(candidates);
        if (target < 0) throw new IllegalArgumentException("Negative target");
        for (int value : candidates) {
            if (value <= 0) throw new IllegalArgumentException("Candidates must be positive");
        }
        int[] unique = Arrays.stream(candidates).distinct().sorted().toArray();
        List<List<Integer>> result = new ArrayList<>();
        combinations(unique, 0, target, new ArrayList<>(), result);
        return result;
    }

    private static void combinations(int[] values, int start, int remaining,
                                     List<Integer> path, List<List<Integer>> result) {
        if (remaining == 0) { result.add(List.copyOf(path)); return; }
        for (int i = start; i < values.length && values[i] <= remaining; i++) {
            path.add(values[i]);
            combinations(values, i, remaining - values[i], path, result);
            path.remove(path.size() - 1);
        }
    }

    // 8. Two heaps. Single-threaded; grows with the stream length.
    public static final class RunningMedian {
        private final PriorityQueue<Integer> lower = new PriorityQueue<>(Comparator.reverseOrder());
        private final PriorityQueue<Integer> upper = new PriorityQueue<>();

        public void add(int value) {
            if (lower.isEmpty() || value <= lower.peek()) lower.add(value);
            else upper.add(value);
            if (lower.size() > upper.size() + 1) upper.add(lower.remove());
            else if (upper.size() > lower.size()) lower.add(upper.remove());
        }

        public double median() {
            if (lower.isEmpty()) throw new NoSuchElementException("Empty stream");
            if (lower.size() != upper.size()) return lower.peek();
            return ((long) lower.peek() + upper.peek()) / 2.0;
        }
    }

    private static int checks;
    private static void check(boolean condition, String description) {
        checks++;
        if (!condition) throw new AssertionError(description);
    }
    private static void throwsType(Class<? extends Throwable> type, Runnable action) {
        try { action.run(); }
        catch (Throwable ex) { check(type.isInstance(ex), "Expected " + type + ", got " + ex); return; }
        throw new AssertionError("Expected " + type);
    }

    public static void main(String[] args) {
        check(lowerBound(new int[0], 1) == 0, "Empty binary search");
        check(lowerBound(new int[]{1, 2, 2, 4}, 2) == 1, "First duplicate");
        check(lowerBound(new int[]{1, 2, 4}, 9) == 3, "After final element");
        check(lowerBound(new int[]{1, 2, 4}, -1) == 0, "Before first element");
        check(countSubarraysWithSum(new int[]{1, -1, 1}, 1) == 3, "Negative prefix values");
        check(countSubarraysWithSum(new int[]{0, 0, 0}, 0) == 6, "Repeated prefix sums");
        check(countSubarraysWithSum(new int[]{Integer.MAX_VALUE, Integer.MAX_VALUE}, 4294967294L) == 1,
              "Prefix arithmetic uses long");
        check(countSubarraysWithSum(new int[0], 0) == 0, "No empty subarray");
        check(Arrays.equals(daysUntilWarmer(new int[]{73, 74, 75, 71, 69, 72, 76, 73}),
                            new int[]{1, 1, 4, 2, 1, 1, 0, 0}), "Warmer days example");
        check(Arrays.equals(daysUntilWarmer(new int[]{4, 4, 3}), new int[]{0, 0, 0}), "Strictly warmer");
        check(daysUntilWarmer(new int[0]).length == 0, "Empty stack input");
        List<List<Edge>> graph = List.of(List.of(new Edge(1, 10), new Edge(2, 1)),
                List.of(new Edge(3, 1)), List.of(new Edge(1, 1), new Edge(3, 8)), List.of(), List.of());
        check(Arrays.equals(shortestPaths(graph, 0), new long[]{0, 2, 1, 3, Long.MAX_VALUE}),
              "Dijkstra stale entry and unreachable node");
        check(Arrays.equals(shortestPaths(List.of(List.of(new Edge(1, 0)), List.of(new Edge(0, 0))), 0),
                            new long[]{0, 0}), "Zero weight cycle");
        check(shortestPaths(List.of(List.of(new Edge(1, Integer.MAX_VALUE)),
                List.of(new Edge(2, Integer.MAX_VALUE)), List.of()), 0)[2] == 4294967294L,
              "Distance arithmetic uses long");
        throwsType(IllegalArgumentException.class,
                   () -> shortestPaths(List.of(List.of(new Edge(0, -1))), 0));
        throwsType(IndexOutOfBoundsException.class, () -> shortestPaths(List.of(), 0));
        DisjointSet sets = new DisjointSet(4);
        check(sets.union(0, 1), "Merge two components");
        check(!sets.union(1, 0), "Duplicate edge");
        check(!sets.union(2, 2), "Self edge");
        check(sets.union(1, 2) && sets.find(0) == sets.find(2), "Transitive connection");
        check(sets.components() == 2, "Component count");
        check(new DisjointSet(0).components() == 0, "Empty sets");
        throwsType(IndexOutOfBoundsException.class, () -> sets.find(4));
        check(editDistance("kitten", "sitting") == 3, "Edit distance example");
        check(editDistance("", "abc") == 3, "Empty source");
        check(editDistance("abc", "") == 3, "Empty target");
        check(editDistance("same", "same") == 0, "Equal strings");
        check(editDistance("", "") == 0, "Both empty");
        int[] candidates = {7, 3, 2, 2};
        check(combinationSum(candidates, 7).equals(List.of(List.of(2, 2, 3), List.of(7))),
              "Unique combinations with reused values");
        check(Arrays.equals(candidates, new int[]{7, 3, 2, 2}), "Preserve input");
        check(combinationSum(new int[0], 0).equals(List.of(List.of())), "Empty combination");
        check(combinationSum(new int[]{2}, 3).isEmpty(), "No combination");
        throwsType(IllegalArgumentException.class, () -> combinationSum(new int[]{0, 1}, 3));
        throwsType(IllegalArgumentException.class, () -> combinationSum(new int[]{1}, -1));
        RunningMedian median = new RunningMedian();
        throwsType(NoSuchElementException.class, median::median);
        median.add(Integer.MAX_VALUE); median.add(Integer.MAX_VALUE);
        check(median.median() == Integer.MAX_VALUE, "Median overflow protection");
        RunningMedian extremes = new RunningMedian();
        extremes.add(Integer.MIN_VALUE); extremes.add(Integer.MAX_VALUE);
        check(extremes.median() == -0.5, "Median extreme signs");
        throwsType(NullPointerException.class, () -> lowerBound(null, 0));

        // Fixed-seed cross-checks against simpler independent reference algorithms.
        Random random = new Random(20261005L);
        for (int trial = 0; trial < 250; trial++) {
            int[] values = new int[random.nextInt(20)];
            for (int i = 0; i < values.length; i++) values[i] = random.nextInt(11) - 5;
            int target = random.nextInt(15) - 7;
            long expectedCount = 0;
            for (int i = 0; i < values.length; i++) {
                long sum = 0;
                for (int j = i; j < values.length; j++) { sum += values[j]; if (sum == target) expectedCount++; }
            }
            check(countSubarraysWithSum(values, target) == expectedCount, "Prefix reference");
            int[] sorted = values.clone(); Arrays.sort(sorted);
            int expectedIndex = 0;
            while (expectedIndex < sorted.length && sorted[expectedIndex] < target) expectedIndex++;
            check(lowerBound(sorted, target) == expectedIndex, "Binary search reference");
            int[] warmer = new int[values.length];
            for (int i = 0; i < values.length; i++) {
                for (int j = i + 1; j < values.length; j++) {
                    if (values[j] > values[i]) { warmer[i] = j - i; break; }
                }
            }
            check(Arrays.equals(daysUntilWarmer(values), warmer), "Monotonic stack reference");
            RunningMedian stream = new RunningMedian();
            for (int i = 0; i < values.length; i++) {
                stream.add(values[i]);
                int[] prefix = Arrays.copyOf(values, i + 1); Arrays.sort(prefix);
                double expected = prefix.length % 2 == 1 ? prefix[prefix.length / 2]
                    : ((long) prefix[prefix.length / 2 - 1] + prefix[prefix.length / 2]) / 2.0;
                check(stream.median() == expected, "Median reference");
            }
        }
        System.out.println("PASS: " + checks + " checks across eight algorithms");
    }
}
