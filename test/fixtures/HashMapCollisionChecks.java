import java.util.HashMap;

// Demonstrates the OpenJDK 21 TreeNode.find ambiguous-order branch without private reflection.
class HashMapCollisionChecks {
    static final class Key {
        static int comparisons;
        final int id;
        Key(int id) { this.id = id; }
        @Override public int hashCode() { return 1; }
        @Override public boolean equals(Object other) {
            comparisons++;
            return other instanceof Key key && key.id == id;
        }
    }
    public static void main(String[] args) {
        var map = new HashMap<Key, Integer>(1024);
        for (int i = 0; i < 256; i++) map.put(new Key(i), i);
        if (!map.entrySet().iterator().next().getClass().getName().endsWith("$TreeNode")) {
            throw new AssertionError("Expected a treeified OpenJDK bin");
        }
        Key.comparisons = 0;
        if (map.containsKey(new Key(-1))) throw new AssertionError("Absent key found");
        if (Key.comparisons < map.size()) {
            throw new AssertionError("Expected full-bin equality work, got " + Key.comparisons);
        }
        System.out.println("treeified equal-hash lookup checked " + Key.comparisons + " candidates");
    }
}
