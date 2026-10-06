import java.util.*;

/** Original implementations for eight public practice prompts. Java 21, no dependencies. */
public final class WebInterviewPractice {
    private WebInterviewPractice() {}

    // Q134. Acyclic next chain; random references must stay inside that chain or be null.
    public static final class RandomNode {
        public final int value;
        public RandomNode next, random;
        public RandomNode(int value) { this.value = value; }
    }
    public static RandomNode copyRandomList(RandomNode head) {
        Map<RandomNode, RandomNode> copies = new IdentityHashMap<>();
        for (RandomNode node = head; node != null; node = node.next)
            copies.put(node, new RandomNode(node.value));
        for (RandomNode node = head; node != null; node = node.next) {
            RandomNode copy = copies.get(node);
            copy.next = copies.get(node.next);
            copy.random = copies.get(node.random);
        }
        return copies.get(head);
    }

    // Q135. UTF-16 string matching; empty input is segmentable. Empty dictionary words are rejected.
    public static boolean wordBreak(String text, Collection<String> dictionary) {
        Objects.requireNonNull(text);
        List<String> words = List.copyOf(new LinkedHashSet<>(dictionary));
        for (String word : words)
            if (word.isEmpty()) throw new IllegalArgumentException("Empty dictionary word");
        boolean[] reachable = new boolean[text.length() + 1];
        reachable[0] = true;
        for (int start = 0; start < text.length(); start++) {
            if (!reachable[start]) continue;
            for (String word : words)
                if (text.startsWith(word, start)) reachable[start + word.length()] = true;
        }
        return reachable[text.length()];
    }

    // Q136. Lowercase ASCII only. Empty word/prefix accepted as an explicit extension.
    public static final class Trie {
        private static final class Node {
            final Node[] children = new Node[26];
            boolean terminal;
        }
        private final Node root = new Node();
        private static void validate(String text) {
            Objects.requireNonNull(text);
            for (int i = 0; i < text.length(); i++)
                if (text.charAt(i) < 'a' || text.charAt(i) > 'z')
                    throw new IllegalArgumentException("Expected lowercase ASCII");
        }
        public void insert(String word) {
            validate(word); // Validate before mutating any nodes.
            Node node = root;
            for (int i = 0; i < word.length(); i++) {
                int index = word.charAt(i) - 'a';
                if (node.children[index] == null) node.children[index] = new Node();
                node = node.children[index];
            }
            node.terminal = true;
        }
        private Node find(String text) {
            validate(text);
            Node node = root;
            for (int i = 0; i < text.length(); i++) {
                node = node.children[text.charAt(i) - 'a'];
                if (node == null) return null;
            }
            return node;
        }
        public boolean search(String word) { Node node = find(word); return node != null && node.terminal; }
        public boolean startsWith(String prefix) { return find(prefix) != null; }
    }

    // Q137. Requires 1 <= k <= values.length; preserves the input.
    public static int[] slidingWindowMaximum(int[] values, int k) {
        Objects.requireNonNull(values);
        if (k < 1 || k > values.length) throw new IllegalArgumentException("Invalid window size");
        int[] result = new int[values.length - k + 1];
        Deque<Integer> deque = new ArrayDeque<>();
        for (int i = 0; i < values.length; i++) {
            while (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.removeFirst();
            while (!deque.isEmpty() && values[deque.peekLast()] <= values[i]) deque.removeLast();
            deque.addLast(i);
            if (i >= k - 1) result[i - k + 1] = values[deque.peekFirst()];
        }
        return result;
    }

    // Q138. Coordinates bounded to +/-1e9 so the squared-distance sum fits long.
    public record Point(int x, int y) {
        public Point {
            if (Math.abs((long) x) > 1_000_000_000L || Math.abs((long) y) > 1_000_000_000L)
                throw new IllegalArgumentException("Coordinate outside supported range");
        }
        long squaredDistance() { return (long) x * x + (long) y * y; }
    }
    public static List<Point> kClosest(List<Point> points, int k) {
        Objects.requireNonNull(points);
        if (k < 0 || k > points.size()) throw new IllegalArgumentException("Invalid k");
        Comparator<Point> order = Comparator.comparingLong(Point::squaredDistance)
            .thenComparingInt(Point::x).thenComparingInt(Point::y);
        PriorityQueue<Point> heap = new PriorityQueue<>(order.reversed());
        for (Point point : points) {
            heap.add(Objects.requireNonNull(point));
            if (heap.size() > k) heap.remove();
        }
        List<Point> result = new ArrayList<>(heap);
        result.sort(order); // Deterministic output, including ties.
        return result;
    }

    // Q139. Single-threaded linked stack; all four operations have O(1) structural work.
    public static final class MinStack {
        private record Entry(int value, int minimum, Entry previous) {}
        private Entry head;
        public void push(int value) {
            head = new Entry(value, head == null ? value : Math.min(value, head.minimum()), head);
        }
        private Entry topEntry() {
            if (head == null) throw new NoSuchElementException("Empty stack");
            return head;
        }
        public int pop() { Entry entry = topEntry(); head = entry.previous(); return entry.value(); }
        public int top() { return topEntry().value(); }
        public int minimum() { return topEntry().minimum(); }
    }

    // Q140. Grammar: lowercase literals and positive-int repetitions. Cap expanded output.
    private record DecodeFrame(StringBuilder prefix, int repetitions) {}
    public static String decode(String encoded, int maxOutputLength) {
        Objects.requireNonNull(encoded);
        if (maxOutputLength < 0) throw new IllegalArgumentException("Negative output limit");
        Deque<DecodeFrame> frames = new ArrayDeque<>();
        StringBuilder current = new StringBuilder();
        int count = 0;
        boolean digits = false;
        for (int i = 0; i < encoded.length(); i++) {
            char c = encoded.charAt(i);
            if (c >= '0' && c <= '9') {
                count = Math.addExact(Math.multiplyExact(count, 10), c - '0');
                digits = true;
            } else if (c == '[') {
                if (!digits || count == 0) throw new IllegalArgumentException("Missing positive count");
                frames.push(new DecodeFrame(current, count));
                current = new StringBuilder(); count = 0; digits = false;
            } else if (c == ']') {
                if (digits || frames.isEmpty()) throw new IllegalArgumentException("Malformed close");
                DecodeFrame frame = frames.pop();
                long size = (long) current.length() * frame.repetitions() + frame.prefix().length();
                if (size > maxOutputLength) throw new IllegalArgumentException("Output limit exceeded");
                StringBuilder expanded = frame.prefix();
                if (!current.isEmpty())
                    for (int repeat = 0; repeat < frame.repetitions(); repeat++) expanded.append(current);
                current = expanded;
            } else {
                if (digits || c < 'a' || c > 'z') throw new IllegalArgumentException("Invalid literal");
                if (current.length() >= maxOutputLength) throw new IllegalArgumentException("Output limit exceeded");
                current.append(c);
            }
        }
        if (digits || !frames.isEmpty()) throw new IllegalArgumentException("Incomplete encoding");
        return current.toString();
    }

    // Q141. Parentheses only; returns length, not the substring.
    public static int longestValidParentheses(String text) {
        Objects.requireNonNull(text);
        Deque<Integer> positions = new ArrayDeque<>();
        positions.push(-1); // Boundary immediately before the current candidate region.
        int best = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '(') positions.push(i);
            else if (c == ')') {
                positions.pop();
                if (positions.isEmpty()) positions.push(i);
                else best = Math.max(best, i - positions.peek());
            } else throw new IllegalArgumentException("Expected parentheses only");
        }
        return best;
    }

    private static int checks;
    private static void check(boolean condition) {
        checks++;
        if (!condition) throw new AssertionError("Check " + checks);
    }
    private static void throwsType(Class<? extends Throwable> type, Runnable action) {
        try { action.run(); }
        catch (Throwable failure) { check(type.isInstance(failure)); return; }
        throw new AssertionError("Expected " + type.getName());
    }
    public static void main(String[] args) {
        RandomNode a = new RandomNode(4), b = new RandomNode(4);
        a.next = b; a.random = b; b.random = a;
        RandomNode copy = copyRandomList(a);
        check(copy != a && copy.next != b && copy.value == 4);
        check(copy.random == copy.next && copy.next.random == copy);
        check(a.next == b && a.random == b && copy.next.next == null);
        check(copyRandomList(null) == null);
        check(wordBreak("applepenapple", List.of("apple", "pen")));
        check(wordBreak("cars", List.of("car", "ca", "rs")));
        check(!wordBreak("catsandog", List.of("cats", "dog", "sand", "and", "cat")));
        check(wordBreak("", List.of()));
        throwsType(IllegalArgumentException.class, () -> wordBreak("a", List.of("")));
        Trie trie = new Trie(); trie.insert("apple");
        check(trie.search("apple") && !trie.search("app") && trie.startsWith("app"));
        trie.insert("app"); check(trie.search("app"));
        trie.insert(""); check(trie.search(""));
        throwsType(IllegalArgumentException.class, () -> trie.insert("ab!"));
        check(!trie.startsWith("ab"));
        check(Arrays.equals(slidingWindowMaximum(new int[]{1, 3, -1, -3, 5, 3, 6, 7}, 3),
                            new int[]{3, 3, 5, 5, 6, 7}));
        throwsType(IllegalArgumentException.class, () -> slidingWindowMaximum(new int[]{1}, 0));
        check(kClosest(List.of(new Point(3, 4), new Point(1, 1), new Point(-1, -1)), 2)
              .equals(List.of(new Point(-1, -1), new Point(1, 1))));
        check(kClosest(List.of(new Point(1_000_000_000, 1_000_000_000), new Point(1, 0)), 1)
              .equals(List.of(new Point(1, 0))));
        check(kClosest(List.of(new Point(1, 2)), 0).isEmpty());
        throwsType(IllegalArgumentException.class, () -> new Point(Integer.MIN_VALUE, 0));
        MinStack stack = new MinStack();
        stack.push(2); stack.push(-1); stack.push(-1);
        check(stack.minimum() == -1); stack.pop(); check(stack.minimum() == -1);
        stack.pop(); check(stack.minimum() == 2 && stack.top() == 2);
        stack.pop(); throwsType(NoSuchElementException.class, stack::minimum);
        check(decode("2[a3[b]]z", 20).equals("abbbabbbz"));
        check(decode("10[x]", 10).equals("xxxxxxxxxx"));
        check(decode("2147483647[]", 0).isEmpty());
        throwsType(IllegalArgumentException.class, () -> decode("100[a]", 99));
        throwsType(IllegalArgumentException.class, () -> decode("2[a", 20));
        throwsType(IllegalArgumentException.class, () -> decode("3a", 20));
        throwsType(ArithmeticException.class, () -> decode("2147483648[a]", 20));
        check(longestValidParentheses(")()())") == 4);
        check(longestValidParentheses("") == 0);
        throwsType(IllegalArgumentException.class, () -> longestValidParentheses("(a)"));

        // Independent brute-force references with a fixed seed.
        Random random = new Random(20261005L);
        for (int trial = 0; trial < 300; trial++) {
            int[] values = new int[1 + random.nextInt(20)];
            for (int i = 0; i < values.length; i++) values[i] = random.nextInt(11) - 5;
            int k = 1 + random.nextInt(values.length);
            int[] expected = new int[values.length - k + 1];
            for (int i = 0; i < expected.length; i++) {
                expected[i] = Integer.MIN_VALUE;
                for (int j = i; j < i + k; j++) expected[i] = Math.max(expected[i], values[j]);
            }
            check(Arrays.equals(slidingWindowMaximum(values, k), expected));
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < random.nextInt(18); i++) text.append(random.nextBoolean() ? '(' : ')');
            int longest = 0;
            for (int start = 0; start < text.length(); start++) {
                int balance = 0;
                for (int end = start; end < text.length(); end++) {
                    balance += text.charAt(end) == '(' ? 1 : -1;
                    if (balance < 0) break;
                    if (balance == 0) longest = Math.max(longest, end - start + 1);
                }
            }
            check(longestValidParentheses(text.toString()) == longest);
            MinStack tested = new MinStack(); List<Integer> reference = new ArrayList<>();
            for (int step = 0; step < 30; step++) {
                if (reference.isEmpty() || random.nextBoolean()) {
                    int value = random.nextInt(); tested.push(value); reference.add(value);
                } else check(tested.pop() == reference.remove(reference.size() - 1));
                if (!reference.isEmpty()) check(tested.minimum() == Collections.min(reference));
            }
        }
        System.out.println("PASS: " + checks + " checks across eight web practice solutions");
    }
}
