package learning.javaindex;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.zip.CRC32;
import java.util.zip.CheckedInputStream;
import java.util.zip.CheckedOutputStream;

final class IndexSnapshot {
    private static final int MAGIC = 0x4A494458; // JIDX
    private static final int VERSION = 1;
    private static final long MAX_BYTES = 64L * 1024 * 1024;

    private IndexSnapshot() {}

    static void save(SearchIndex index, Path destination) throws IOException {
        Path target = destination.toAbsolutePath().normalize();
        Path pending = Files.createTempFile(target.getParent(), ".java-index-", ".pending");
        try {
            write(index, pending);
            if (Thread.currentThread().isInterrupted()) {
                throw new java.io.InterruptedIOException("Index publication interrupted");
            }
            // The provider must support atomic replacement. No non-atomic fallback.
            Files.move(pending, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException | RuntimeException | Error failure) {
            try {
                Files.deleteIfExists(pending);
            } catch (IOException cleanup) {
                failure.addSuppressed(cleanup);
            }
            throw failure;
        }
    }

    private static void write(SearchIndex index, Path pending) throws IOException {
        try (var raw = new BufferedOutputStream(Files.newOutputStream(pending))) {
            var crc = new CRC32();
            var data = new DataOutputStream(new CheckedOutputStream(raw, crc));
            data.writeInt(MAGIC);
            data.writeInt(VERSION);
            var documents = index.documents();
            data.writeInt(documents.size());
            for (String path : documents.keySet().stream().sorted().toList()) {
                data.writeUTF(path);
                var terms = documents.get(path);
                data.writeInt(terms.size());
                for (String term : terms.stream().sorted().toList()) data.writeUTF(term);
            }
            // The footer stores the checksum of all preceding bytes.
            new DataOutputStream(raw).writeLong(crc.getValue());
        }
        if (Files.size(pending) > MAX_BYTES) throw new IOException("Snapshot exceeds 64 MiB");
    }

    static SearchIndex load(Path path) throws IOException {
        if (Files.size(path) > MAX_BYTES) throw new IOException("Snapshot exceeds 64 MiB");
        try (var raw = new BufferedInputStream(Files.newInputStream(path))) {
            var crc = new CRC32();
            var data = new DataInputStream(new CheckedInputStream(raw, crc));
            if (data.readInt() != MAGIC || data.readInt() != VERSION) {
                throw new IOException("Unsupported index snapshot");
            }
            int documentCount = readCount(data, SearchIndex.MAX_DOCUMENTS);
            int remaining = SearchIndex.MAX_POSTINGS;
            var index = new SearchIndex.Builder();
            for (int i = 0; i < documentCount; i++) {
                String name = data.readUTF();
                int termCount = readCount(data, remaining);
                remaining -= termCount;
                var terms = new HashSet<String>();
                for (int j = 0; j < termCount; j++) {
                    String term = data.readUTF();
                    if (!SearchIndex.terms(term).equals(java.util.Set.of(term)) || !terms.add(term)) {
                        throw new IOException("Invalid term in index snapshot");
                    }
                }
                index.add(name, terms);
            }
            if (new DataInputStream(raw).readLong() != crc.getValue() || raw.read() != -1) {
                throw new IOException("Corrupt index snapshot");
            }
            return index.build();
        } catch (IllegalArgumentException invalid) {
            throw new IOException("Invalid index snapshot", invalid);
        }
    }

    private static int readCount(DataInputStream data, int limit) throws IOException {
        int count = data.readInt();
        if (count < 0 || count > limit) throw new IOException("Invalid count in index snapshot");
        return count;
    }
}
