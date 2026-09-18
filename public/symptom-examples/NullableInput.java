public class NullableInput {
    public static void main(String[] args) {
        Boolean enabled = null;
        try { boolean primitive = enabled; throw new AssertionError("Expected unboxing failure: " + primitive); }
        catch (NullPointerException expected) { System.out.println("Null unboxing detected"); }
        // This example explicitly chooses absent-as-false; some APIs must reject absence instead.
        boolean value = Boolean.TRUE.equals(enabled);
        if (value) throw new AssertionError();
        System.out.println("Explicit absent-as-false policy: " + value);
    }
}
