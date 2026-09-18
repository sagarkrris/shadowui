import java.lang.reflect.Proxy;
// Mechanism model only: no Spring, transaction manager, or async executor.
public class ProxyBoundary {
    interface Service { void outer(); void inner(); }
    static final class Target implements Service {
        public void outer() { inner(); }
        public void inner() { }
    }
    public static void main(String[] args) {
        Target target = new Target();
        int[] intercepted = {0};
        Service proxy = (Service) Proxy.newProxyInstance(Service.class.getClassLoader(),
            new Class<?>[] {Service.class}, (instance, method, arguments) -> {
                if (method.getName().equals("inner")) intercepted[0]++;
                return method.invoke(target, arguments);
            });
        proxy.outer();
        if (intercepted[0] != 0) throw new AssertionError();
        System.out.println("Self call intercepted: false");
        proxy.inner();
        if (intercepted[0] != 1) throw new AssertionError();
        System.out.println("External call intercepted: true");
    }
}
