package learning.javaindex;

import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import jdk.jfr.Recording;
import jdk.jfr.consumer.RecordingFile;

public final class JvmLab {
    private static int initialized;

    private JvmLab() {}

    public static void main(String[] args) throws Exception {
        Path work = Path.of(args[0]);
        checkInitialization();
        checkRecording(work);
        System.out.println("JVM lab passed: deferred initialization and recorded index build event");
    }

    private static void checkInitialization() throws ClassNotFoundException {
        String name = JvmLab.class.getName() + "$Probe";
        var loader = JvmLab.class.getClassLoader();
        Class<?> loaded = Class.forName(name, false, loader);
        check(initialized == 0, "lookup with initialize=false did not run the static initializer");
        check(Class.forName(name, true, loader) == loaded && initialized == 1,
                "initializing lookup used the same class and ran the static initializer");
        Class.forName(name, true, loader);
        check(initialized == 1, "initialization ran once for this defined class");
    }

    private static void checkRecording(Path work) throws Exception {
        Path input = Files.createDirectory(work.resolve("jfr-input"));
        Files.writeString(input.resolve("one.txt"), "Java recorded");
        Path snapshot = work.resolve("jfr-build.jidx");
        Path file = work.resolve("index-build.jfr");
        try (var recording = new Recording(); var out = new PrintStream(OutputStream.nullOutputStream())) {
            recording.enable("learning.javaindex.Build");
            recording.start();
            check(Indexer.run(new String[]{"build", input.toString(), snapshot.toString(), "2"}, out, out) == 0,
                    "build completed under recording");
            recording.stop();
            recording.dump(file);
        }
        try (var events = new RecordingFile(file)) {
            boolean found = false;
            while (events.hasMoreEvents()) {
                var event = events.readEvent();
                if (event.getEventType().getName().equals("learning.javaindex.Build")) {
                    check(event.getBoolean("published") && event.getInt("documents") == 1
                            && event.getInt("workers") == 2, "recorded fields describe committed build");
                    found = true;
                }
            }
            check(found, "expected one observed build event");
        }
    }

    private static void check(boolean condition, String description) {
        if (!condition) throw new AssertionError(description);
    }

    private static final class Probe {
        static { initialized++; }
    }
}
