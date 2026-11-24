package learning.hibernate;

import jakarta.persistence.OptimisticLockException;
import java.util.List;

public final class OrderCatalogDemo {
    private OrderCatalogDemo() {}

    public static void main(String[] args) {
        try (var factory = LabDatabase.open()) {
            var catalog = new OrderCatalog(factory);
            long first = catalog.create("Starter order", List.of("NOTEBOOK", "PENCIL"));
            catalog.create("Empty order", List.of());
            long before = factory.getStatistics().getPrepareStatementCount();
            var page = catalog.pageAfter(0, 2);
            long statements = factory.getStatistics().getPrepareStatementCount() - before;
            System.out.println("Initial page: " + page);
            System.out.println("Page statements: " + statements);
            long version = page.getFirst().version();
            catalog.rename(first, version, "Confirmed order");
            try {
                catalog.rename(first, version, "Stale overwrite");
                throw new AssertionError("Expected a stale update conflict");
            } catch (OptimisticLockException expected) {
                System.out.println("Stale update rejected");
            }
            System.out.println("Committed page: " + catalog.pageAfter(0, 2));
        }
    }
}
