package learning.javaindex;

import java.io.IOException;
import java.io.PrintStream;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import jdk.jfr.Event;
import jdk.jfr.Label;
import jdk.jfr.Name;

public final class Indexer {
    private Indexer() {}

    public static void main(String[] args) {
        int status = run(args, System.out, System.err);
        if (status != 0) System.exit(status);
    }

    static int run(String[] args, PrintStream out, PrintStream err) {
        try {
            if (args.length == 4 && args[0].equals("build")) {
                Path snapshot = snapshot(args[2]);
                var event = new IndexBuildEvent();
                event.workers = Integer.parseInt(args[3]);
                event.begin();
                try {
                    var index = FileIndexer.build(Path.of(args[1]), event.workers);
                    event.documents = index.documents().size();
                    IndexSnapshot.save(index, snapshot);
                    event.published = true;
                } finally {
                    event.commit();
                }
                out.println("Indexed " + event.documents + " files");
                return 0;
            }
            if (args.length == 3 && args[0].equals("search")) {
                IndexSnapshot.load(snapshot(args[1])).search(args[2]).forEach(out::println);
                return 0;
            }
            throw new IllegalArgumentException("Usage: build <root> <snapshot.jidx> <workers> | search <snapshot.jidx> <query>");
        } catch (IllegalArgumentException input) {
            err.println(input.getMessage());
            return 2;
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            err.println("Index build interrupted");
            return 1;
        } catch (IOException | UncheckedIOException failure) {
            err.println(failure.getMessage());
            return 1;
        }
    }

    private static Path snapshot(String value) {
        Path path = Path.of(value);
        if (path.getFileName() == null || !path.getFileName().toString().endsWith(".jidx")) {
            throw new IllegalArgumentException("Use a .jidx snapshot file");
        }
        return path;
    }

    @Name("learning.javaindex.Build")
    @Label("File index build")
    static final class IndexBuildEvent extends Event {
        int workers;
        int documents;
        boolean published;
    }
}
