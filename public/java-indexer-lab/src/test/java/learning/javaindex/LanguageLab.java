package learning.javaindex;

import java.util.ArrayList;
import java.util.List;

public final class LanguageLab {
    private LanguageLab() {}

    public static void main(String[] args) throws Exception {
        checkGenericErasureAndDispatch();
        checkResourceOwnership();
        checkRecordsCopyMutableComponents();
        System.out.println("Language lab passed: erasure, dispatch, suppressed exceptions and record ownership");
    }

    private static void checkGenericErasureAndDispatch() throws Exception {
        var base = new Formatter<String>();
        Formatter<String> derived = new UpperFormatter();
        check(base.format("java").equals("java"), "base dispatch");
        check(derived.format("java").equals("JAVA"), "overridden dispatch");
        check(Formatter.class.getDeclaredMethod("format", Object.class).getReturnType() == Object.class,
                "T erases to Object in this declaration");
        check(java.util.Arrays.stream(UpperFormatter.class.getDeclaredMethods()).anyMatch(
                method -> method.isBridge() && method.getParameterTypes()[0] == Object.class),
                "Javac emitted an erased bridge");
    }

    private static void checkResourceOwnership() throws Exception {
        var closed = new ArrayList<String>();
        try (var first = new ClosingProbe("first", closed); var second = new ClosingProbe("second", closed)) {
            throw new IllegalStateException("body");
        } catch (IllegalStateException failure) {
            check(failure.getMessage().equals("body"), "body failure remains primary");
            check(closed.equals(List.of("second", "first")), "resources close in reverse order");
            var suppressed = failure.getSuppressed();
            check(suppressed.length == 2 && suppressed[0].getMessage().equals("second")
                    && suppressed[1].getMessage().equals("first"), "both close failures remain visible");
        }
    }

    private static void checkRecordsCopyMutableComponents() {
        var input = new ArrayList<>(List.of("java"));
        var query = new Query(input);
        input.clear();
        check(query.terms().equals(List.of("java")), "caller cannot change record contents");
        try {
            query.terms().add("bad");
            throw new AssertionError("the accessor returned a mutable list");
        } catch (UnsupportedOperationException expected) {
            // List.copyOf supplies an unmodifiable list of immutable strings here.
        }
    }

    private static void check(boolean condition, String description) {
        if (!condition) throw new AssertionError(description);
    }

    public static class Formatter<T> {
        public T format(T value) { return value; }
    }

    public static final class UpperFormatter extends Formatter<String> {
        @Override public String format(String value) { return value.toUpperCase(java.util.Locale.ROOT); }
    }

    private record ClosingProbe(String name, List<String> closed) implements AutoCloseable {
        @Override public void close() throws java.io.IOException {
            closed.add(name);
            throw new java.io.IOException(name);
        }
    }

    private record Query(List<String> terms) {
        Query { terms = List.copyOf(terms); }
    }
}
