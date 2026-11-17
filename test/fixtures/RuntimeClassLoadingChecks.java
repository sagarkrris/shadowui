import java.net.URLClassLoader;
import java.net.URL;

public class RuntimeClassLoadingChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  public static void main(String[] args) throws Exception {
    check(RuntimeToolsExample.hasCompiler()); // These labs run in the build JDK.
    check(!BytecodeHeaderExample.hasMagic(null));
    check(!BytecodeHeaderExample.hasMagic(new byte[0]));
    check(!BytecodeHeaderExample.hasMagic(new byte[]{0,0,0,0}));
    check(BytecodeHeaderExample.hasMagic(new byte[]{(byte)202,(byte)254,(byte)186,(byte)190}));
    check(RuntimeMemoryExample.sum(0) == 0);
    check(RuntimeMemoryExample.sum(Integer.MAX_VALUE) == 2305843005992468481L);
    try { RuntimeMemoryExample.sum(-1); throw new AssertionError(); } catch (IllegalArgumentException expected) { }
    check(JitWorkExample.sum(new int[0]) == 0);
    check(JitWorkExample.sum(new int[]{Integer.MAX_VALUE, Integer.MAX_VALUE, -1}) == 4294967293L);
    try { JitWorkExample.sum(null); throw new AssertionError(); } catch (NullPointerException expected) { }
    check(LoaderTypesExample.definingLoader(Object.class) == null);
    check(LoaderTypesExample.definingLoader(java.sql.Driver.class) == ClassLoader.getPlatformClassLoader());
    check(LoaderTypesExample.definingLoader(RuntimeClassLoadingChecks.class) == ClassLoader.getSystemClassLoader());
    check(DelegationExample.throughChild("java.lang.String") == String.class);
    try { DelegationExample.throughChild("missing.NoSuchClass"); throw new AssertionError(); } catch (ClassNotFoundException expected) { }
    Class<?> target = InitializationExample.locate(false);
    check(InitializationExample.initialized == 0);
    check(InitializationExample.locate(true) == target);
    check(InitializationExample.initialized == 1);
    check(InitializationExample.locate(true) == target);
    check(InitializationExample.initialized == 1);
    URL root = RuntimeClassLoadingChecks.class.getProtectionDomain().getCodeSource().getLocation();
    try (var a = new URLClassLoader(new URL[]{root}, null); var b = new URLClassLoader(new URL[]{root}, null)) {
      Class<?> first = PluginIsolationExample.load(a), second = PluginIsolationExample.load(b);
      check(first != second && first.getName().equals(second.getName()));
      check(first.getClassLoader() == a && second.getClassLoader() == b);
      var constructor = first.getDeclaredConstructor();
      constructor.setAccessible(true); // Unnamed-module, local trusted lab only.
      Object value = constructor.newInstance();
      check(first.isInstance(value) && !second.isInstance(value));
      try { second.cast(value); throw new AssertionError(); } catch (ClassCastException expected) { }
      check(a.loadClass("java.lang.Object") == Object.class);
    }
    System.out.println("runtime semantics passed: delegation, initialization, identity, failure boundaries");
  }
}
