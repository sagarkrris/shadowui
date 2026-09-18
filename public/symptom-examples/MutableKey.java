import java.util.HashMap;
import java.util.Map;
public class MutableKey {
    static final class Key {
        int id;
        Key(int id) { this.id = id; }
        public int hashCode() { return id; }
        public boolean equals(Object other) { return other instanceof Key && ((Key) other).id == id; }
    }
    public static void main(String[] args) {
        Map<Key, String> broken = new HashMap<>();
        Key key = new Key(1);
        broken.put(key, "found"); key.id = 2;
        if (broken.get(key) != null || broken.size() != 1) throw new AssertionError();
        Map<Integer, String> stable = new HashMap<>();
        stable.put(1, "found");
        if (!"found".equals(stable.get(1))) throw new AssertionError();
        System.out.println("Mutable key lookup: null");
        System.out.println("Immutable ID lookup: found");
    }
}
