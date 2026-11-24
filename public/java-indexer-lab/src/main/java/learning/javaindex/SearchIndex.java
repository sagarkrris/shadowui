package learning.javaindex;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

final class SearchIndex {
    static final int MAX_DOCUMENTS = 1_000;
    static final int MAX_POSTINGS = 100_000;
    private static final Pattern TOKEN = Pattern.compile("[\\p{L}\\p{N}][\\p{L}\\p{M}\\p{N}]*");
    private static final int MAX_TERM_LENGTH = 128;

    private final Map<String, Set<String>> documents;
    private final Map<String, Set<String>> postings;

    private SearchIndex(Map<String, Set<String>> documents) {
        this.documents = Map.copyOf(documents);
        var inverted = new HashMap<String, Set<String>>();
        documents.forEach((path, terms) -> terms.forEach(term ->
                inverted.computeIfAbsent(term, ignored -> new HashSet<>()).add(path)));
        inverted.replaceAll((term, paths) -> Set.copyOf(paths));
        this.postings = Map.copyOf(inverted);
    }

    static Set<String> terms(String text) {
        String normalized = Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFC);
        var matcher = TOKEN.matcher(normalized);
        var unique = new LinkedHashSet<String>();
        while (matcher.find()) {
            if (matcher.end() - matcher.start() > MAX_TERM_LENGTH) {
                throw new IllegalArgumentException("Token exceeds 128 UTF-16 units");
            }
            unique.add(matcher.group());
        }
        return Set.copyOf(unique);
    }

    List<String> search(String query) {
        Set<String> queryTerms = terms(query);
        if (queryTerms.isEmpty()) return List.of();

        var sets = queryTerms.stream()
                .map(term -> postings.getOrDefault(term, Set.of()))
                .sorted(Comparator.comparingInt(Set::size))
                .toList();
        var matches = new HashSet<>(sets.getFirst());
        for (int i = 1; i < sets.size() && !matches.isEmpty(); i++) {
            matches.retainAll(sets.get(i));
        }
        return matches.stream().sorted().toList();
    }

    Map<String, Set<String>> documents() {
        return documents;
    }

    static final class Builder {
        private final Map<String, Set<String>> documents = new HashMap<>();
        private int postingCount;

        void add(String path, Set<String> terms) {
            if (path.isEmpty() || path.length() > 4_096 || path.startsWith("/")
                    || path.indexOf('\\') >= 0 || path.chars().anyMatch(Character::isISOControl)
                    || Arrays.stream(path.split("/", -1)).anyMatch(
                            part -> part.isEmpty() || part.equals(".") || part.equals(".."))) {
                throw new IllegalArgumentException("Unsupported relative file name");
            }
            if (documents.size() >= MAX_DOCUMENTS || terms.size() > MAX_POSTINGS - postingCount) {
                throw new IllegalArgumentException("Index exceeds document or posting limit");
            }
            if (documents.putIfAbsent(path, Set.copyOf(terms)) != null) {
                throw new IllegalArgumentException("Duplicate document in index");
            }
            postingCount += terms.size();
        }

        SearchIndex build() {
            return new SearchIndex(documents);
        }
    }
}
