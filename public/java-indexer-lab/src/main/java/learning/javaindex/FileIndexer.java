package learning.javaindex;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.Executors;

final class FileIndexer {
    static final int MAX_FILE_BYTES = 1_048_576;

    private FileIndexer() {}

    static SearchIndex build(Path root, int workers) throws IOException, InterruptedException {
        if (workers < 1 || workers > 16) {
            throw new IllegalArgumentException("Workers must be between 1 and 16");
        }
        checkInterrupted();
        if (!Files.isDirectory(root, LinkOption.NOFOLLOW_LINKS)) {
            throw new IOException("Expected a local directory");
        }

        var index = new SearchIndex.Builder();
        try (var executor = Executors.newFixedThreadPool(workers)) {
            try {
                var completed = new ExecutorCompletionService<Document>(executor);
                int pending = 0;
                int submitted = 0;
                try (var paths = Files.find(root, Integer.MAX_VALUE, (path, attributes) ->
                        attributes.isRegularFile() && path.getFileName().toString().endsWith(".txt"))) {
                    var files = paths.iterator();
                    while (files.hasNext()) {
                        checkInterrupted();
                        if (++submitted > SearchIndex.MAX_DOCUMENTS) {
                            throw new IOException("Too many .txt files");
                        }
                        Path file = files.next();
                        completed.submit(() -> read(root, file));
                        pending++;
                        if (pending == workers * 2) {
                            addCompleted(index, completed);
                            pending--;
                        }
                    }
                }
                while (pending > 0) {
                    addCompleted(index, completed);
                    pending--;
                }
            } finally {
                executor.shutdownNow();
            }
        }
        checkInterrupted();
        return index.build();
    }

    private static Document read(Path root, Path file) throws IOException, InterruptedException {
        checkInterrupted();
        try (var input = Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)) {
            byte[] bytes = input.readNBytes(MAX_FILE_BYTES + 1);
            if (bytes.length > MAX_FILE_BYTES) throw new IOException("File exceeds 1 MiB");
            String text = StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(bytes)).toString();
            checkInterrupted();
            return new Document(root.relativize(file).toString().replace(File.separatorChar, '/'),
                    SearchIndex.terms(text));
        } catch (IOException | IllegalArgumentException failure) {
            throw new IOException("Cannot index " + root.relativize(file) + ": " + failure.getMessage(), failure);
        }
    }

    private static void addCompleted(SearchIndex.Builder index, ExecutorCompletionService<Document> completion)
            throws IOException, InterruptedException {
        try {
            Document document = completion.take().get();
            index.add(document.path(), document.terms());
        } catch (ExecutionException failure) {
            if (failure.getCause() instanceof IOException io) throw io;
            if (failure.getCause() instanceof InterruptedException interrupted) throw interrupted;
            throw new IOException("Index worker failed", failure.getCause());
        }
    }

    private static void checkInterrupted() throws InterruptedException {
        if (Thread.currentThread().isInterrupted()) throw new InterruptedException("Index build interrupted");
    }

    private record Document(String path, Set<String> terms) {}
}
