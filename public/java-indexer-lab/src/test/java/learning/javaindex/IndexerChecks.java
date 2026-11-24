package learning.javaindex;

import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

public final class IndexerChecks {
    private IndexerChecks() {}

    public static void main(String[] args) throws Exception {
        Path work = Path.of(args[0]);
        var root = Files.createDirectory(work.resolve("input"));
        Files.writeString(root.resolve("a.txt"), "JAVA café java");
        Files.writeString(root.resolve("b.txt"), "Java threads");
        Files.writeString(root.resolve("ignored.md"), "java");
        Files.writeString(root.resolve("empty.txt"), "");
        Files.createSymbolicLink(root.resolve("link.txt"), root.resolve("a.txt"));

        var index = FileIndexer.build(root, 1);
        check(index.search("JAVA").equals(List.of("a.txt", "b.txt")), "stable order, duplicate and symlink handling");
        check(index.search("JAVA cafe\u0301").equals(List.of("a.txt")), "Unicode normalized AND");
        check(index.search("java unknown").isEmpty(), "absent term");
        check(index.search("?!").isEmpty(), "empty query");
        check(index.documents().get("empty.txt").isEmpty() && index.documents().size() == 3, "empty file retained");
        var builder = new SearchIndex.Builder();
        var callerTerms = new java.util.HashSet<>(Set.of("java"));
        builder.add("copy.txt", callerTerms);
        callerTerms.clear();
        check(builder.build().search("java").equals(List.of("copy.txt")), "owned posting sets");

        Path snapshot = work.resolve("index.jidx");
        IndexSnapshot.save(index, snapshot);
        Path parallel = work.resolve("parallel.jidx");
        IndexSnapshot.save(FileIndexer.build(root, 4), parallel);
        byte[] good = Files.readAllBytes(snapshot);
        check(Arrays.equals(good, Files.readAllBytes(parallel)), "parallel output is deterministic");
        check(IndexSnapshot.load(snapshot).search("threads").equals(List.of("b.txt")), "reload preserves search");

        assertFailedBuildPreservesSnapshot(root, snapshot, good, new byte[]{(byte) 0xC3, 0x28});
        assertFailedBuildPreservesSnapshot(root, snapshot, good, new byte[FileIndexer.MAX_FILE_BYTES + 1]);
        assertCorruptionRejected(work, good);
        assertInterruptedBuildPreservesSnapshot(root, snapshot, good);
        Files.delete(root.resolve("b.txt"));
        Files.writeString(root.resolve("a.txt"), "Updated");
        IndexSnapshot.save(FileIndexer.build(root, 2), snapshot);
        check(IndexSnapshot.load(snapshot).search("java").isEmpty(), "rebuild removes deleted and old content");
        check(IndexSnapshot.load(snapshot).search("updated").equals(List.of("a.txt")), "rebuild publishes new content");
        System.out.println("Indexer lab passed: matching, bounded input, corruption, cancellation and atomic rebuild");
    }

    private static void assertFailedBuildPreservesSnapshot(Path root, Path snapshot, byte[] good,
                                                            byte[] invalid) throws Exception {
        Path invalidFile = root.resolve("invalid.txt");
        Files.write(invalidFile, invalid);
        try (var out = new PrintStream(OutputStream.nullOutputStream())) {
            check(Indexer.run(new String[]{"build", root.toString(), snapshot.toString(), "2"}, out, out) == 1,
                    "invalid input rejected");
            check(Arrays.equals(good, Files.readAllBytes(snapshot)), "worker failure preserved the previous snapshot");
        } finally {
            Files.delete(invalidFile);
        }
    }

    private static void assertCorruptionRejected(Path work, byte[] good) throws Exception {
        Path corrupt = work.resolve("corrupt.jidx");
        Files.write(corrupt, Arrays.copyOf(good, good.length - 1));
        checkUnreadable(corrupt);
        byte[] damaged = good.clone();
        damaged[damaged.length - 1] ^= 1;
        Files.write(corrupt, damaged);
        checkUnreadable(corrupt);
    }

    private static void checkUnreadable(Path snapshot) throws Exception {
        try {
            IndexSnapshot.load(snapshot);
            throw new AssertionError("corrupt snapshot loaded");
        } catch (java.io.IOException expected) {
            // A search must never return results from the damaged revision.
        }
    }

    private static void assertInterruptedBuildPreservesSnapshot(Path root, Path snapshot, byte[] good) throws Exception {
        try (var out = new PrintStream(OutputStream.nullOutputStream())) {
            Thread.currentThread().interrupt();
            try {
                check(Indexer.run(new String[]{"build", root.toString(), snapshot.toString(), "2"}, out, out) == 1,
                        "interrupted build failed");
                check(Thread.currentThread().isInterrupted(), "interrupt restored at CLI boundary");
            } finally {
                Thread.interrupted();
            }
            check(Arrays.equals(good, Files.readAllBytes(snapshot)), "interruption did not publish");
        }
    }

    private static void check(boolean condition, String description) {
        if (!condition) throw new AssertionError(description);
    }
}
