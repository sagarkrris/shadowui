export const TINY_CONTAINER_PATH = '/build/java-dependency-injection';
export const TINY_CONTAINER_KEY = 'interviewiq.tinyContainer.v1';
export const CHAPTERS = [
  { id: 'registry', title: '1. Give objects a home', requirement: 'Register an instance by its class and retrieve that exact instance. Reject nulls and missing registrations.', limitation: 'A registry cannot construct a service or discover what its constructor needs.', explanation: 'An explicit registry separates object lookup from object ownership. Class.cast checks the runtime type at the boundary.', test: 'Registered instance identity; missing registration rejected.', prediction: 'Does a registry create an unregistered object?', answer: 'No. This first design only returns instances explicitly registered by the caller.' },
  { id: 'constructors', title: '2. Follow constructor dependencies', requirement: 'If no instance is registered, recursively construct a concrete class using its single public constructor. Interfaces still need an explicit instance.', limitation: 'Every lookup constructs a new object. Shared state unexpectedly splits across instances.', explanation: 'Constructor parameters form graph edges. Resolve each edge before invoking the constructor. Multiple public constructors are ambiguous in this deliberately small contract.', test: 'Nested constructor injection; interface registration; ambiguous constructors rejected.', prediction: 'Will two lookups return the same constructed service?', answer: 'No. Recursive construction alone gives a fresh object for every lookup.' },
  { id: 'singletons', title: '3. Preserve identity', requirement: 'Cache a fully constructed object only after its constructor succeeds. Repeated lookups must reuse the instance.', limitation: 'A → B → A still recurses forever. Caching unfinished objects would leak invalid state.', explanation: 'A cache answers “already finished?” It cannot answer “currently being built?” Those are different states. Failed construction must never enter the cache.', test: 'Repeated lookup identity; nested shared dependency identity; failed construction retried.', prediction: 'Does a singleton cache alone prevent circular constructor dependencies?', answer: 'No. Neither object is cached until its constructor finishes, so a cycle never reaches the cache.' },
  { id: 'cycles', title: '4. Detect a cycle and recover', requirement: 'Track the current construction path, reject re-entry with an actionable cycle error, and always remove the path entry in finally.', limitation: 'This container is single-threaded and omits qualifiers, scopes, lifecycle callbacks, proxies, generic type resolution, configuration, and component scanning.', explanation: 'The active path detects a back edge. A finally block clears it after success or failure so later lookups are not falsely reported as cycles. A singleton cache does not make the objects it holds thread-safe.', test: 'Cycle rejected; failure cleanup; all earlier contracts preserved.', prediction: 'Does singleton scope make a mutable service thread-safe?', answer: 'No. Sharing one object provides identity, not synchronization or safe concurrent mutation.' },
];

export function containerSource(stage, solution = false) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= CHAPTERS.length) throw new Error('Unknown chapter');
  const body = solution ? `if (instances.containsKey(type)) return type.cast(instances.get(type));
${stage === 0 ? '        throw new IllegalArgumentException("Missing registration: " + type.getName());' : `        ${stage === 3 ? 'if (!active.add(type)) throw new IllegalArgumentException("Cycle: " + active + " -> " + type.getName());' : ''}
        try {
            Constructor<?>[] constructors = type.getConstructors();
            if (type.isInterface() || constructors.length != 1) {
                throw new IllegalArgumentException("Need one public constructor: " + type.getName());
            }
            Constructor<?> constructor = constructors[0];
            Class<?>[] parameters = constructor.getParameterTypes();
            Object[] arguments = new Object[parameters.length];
            for (int i = 0; i < parameters.length; i++) arguments[i] = get(parameters[i]);
            T result = type.cast(constructor.newInstance(arguments));
            ${stage >= 2 ? 'instances.put(type, result);' : '// No cache yet: each lookup creates a new instance.'}
            return result;
        } catch (ReflectiveOperationException failure) {
            throw new IllegalArgumentException("Construction failed: " + type.getName(), failure);
        }${stage === 3 ? ' finally {\n            active.remove(type);\n        }' : ''}`}` : '// TODO: implement this chapter, preserving earlier requirements.\n        throw new UnsupportedOperationException("Implement get");';
  return `import java.util.*;
import java.lang.reflect.*;

// Educational, single-threaded container. Java 8 language/API baseline.
class TinyContainer {
    private final Map<Class<?>, Object> instances = new HashMap<>();
    private final Set<Class<?>> active = new LinkedHashSet<>();

    public <T> void register(Class<T> type, T instance) {
        Objects.requireNonNull(type, "type");
        instances.put(type, type.cast(Objects.requireNonNull(instance, "instance")));
    }

    public <T> T get(Class<T> type) {
        Objects.requireNonNull(type, "type");
        ${body}
    }
}
`;
}

export function javaExercise(stage, source) {
  if (!CHAPTERS[stage] || typeof source !== 'string' || source.length > 20000) throw new Error('Invalid exercise');
  return `${source}\n
public class Main {
    static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
        System.out.println("PASS: " + message);
    }
    static void rejects(Runnable action, String message) {
        try { action.run(); } catch (IllegalArgumentException expected) {
            System.out.println("PASS: " + message); return;
        }
        throw new AssertionError(message);
    }
    public interface Port {}
    public static class Repo implements Port { public Repo() {} }
    public static class Service {
        final Port repo;
        public Service(Port repo) { this.repo = repo; }
    }
    public static class Root {
        final Service first, second;
        public Root(Service first, Service second) { this.first = first; this.second = second; }
    }
    public static class Ambiguous { public Ambiguous() {} public Ambiguous(Repo repo) {} }
    public static class Flaky {
        static int attempts;
        public Flaky() { if (++attempts == 1) throw new IllegalStateException("first attempt fails"); }
    }
    public static class A { public A(B b) {} }
    public static class B { public B(A a) {} }
    public static void main(String[] args) {
        TinyContainer c = new TinyContainer();
        Repo repo = new Repo();
        c.register(Port.class, repo);
        check(c.get(Port.class) == repo, "registered instance identity");
        ${stage === 0 ? 'rejects(() -> c.get(Service.class), "missing registration rejected");' : `check(c.get(Service.class).repo == repo, "constructor injection");
        check(c.get(Root.class).first.repo == repo, "nested constructor injection");
        rejects(() -> c.get(Ambiguous.class), "ambiguous constructors rejected");
        rejects(() -> new TinyContainer().get(Port.class), "unbound interface rejected");
        ${stage >= 2 ? 'check(c.get(Service.class) == c.get(Service.class), "singleton identity");\n        check(c.get(Root.class).first == c.get(Root.class).second, "nested singleton identity");\n        rejects(() -> c.get(Flaky.class), "failed construction reported");\n        check(c.get(Flaky.class) != null && Flaky.attempts == 2, "failed construction can retry");' : 'check(c.get(Service.class) != c.get(Service.class), "prototype identity before caching");'}
        ${stage === 3 ? 'rejects(() -> c.get(A.class), "cycle rejected");\n        rejects(() -> c.get(A.class), "cycle failure clears active path");\n        check(c.get(Service.class).repo == repo, "unrelated lookup still works");' : ''}`}
        System.out.println("All chapter checks passed");
    }
}
`;
}

// Executes only the fixed graph model; never evaluates reader Java or JavaScript.
export function runContainerModel({ cache = false, detectCycles = false, cycle = false } = {}) {
  const graph = cycle ? { Service: ['Repo'], Repo: ['Service'] } : { Service: ['Repo'], Repo: [] };
  const instances = new Map(), active = new Set(), trace = [];
  let count = 0;
  function resolve(type, depth = 0) {
    if (depth > 8) throw new Error('Model stopped repeated recursion. Add active-path cycle detection.');
    if (instances.has(type)) { trace.push(`Reuse ${type}`); return instances.get(type); }
    if (detectCycles && active.has(type)) throw new Error(`Cycle detected at ${type}`);
    active.add(type);
    trace.push(`Enter ${type}`);
    try {
      graph[type].forEach(dependency => resolve(dependency, depth + 1));
      const instance = { id: ++count };
      trace.push(`Construct ${type} #${instance.id}`);
      if (cache) instances.set(type, instance);
      return instance;
    } finally { active.delete(type); }
  }
  try {
    const first = resolve('Service'), second = resolve('Service');
    return { trace, same: first === second, error: null };
  } catch (error) { return { trace, same: false, error: error.message }; }
}
