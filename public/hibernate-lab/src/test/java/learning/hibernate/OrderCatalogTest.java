package learning.hibernate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.OptimisticLockException;
import java.util.List;
import java.util.NoSuchElementException;
import org.hibernate.HibernateException;
import org.junit.jupiter.api.Test;

class OrderCatalogTest {
    @Test
    void pagedFetchAvoidsNPlusOnePreservesEmptyOrdersAndRestoresIdOrder() {
        try (var factory = LabDatabase.open()) {
            var catalog = new OrderCatalog(factory);
            long first = catalog.create("First", List.of("A", "B"));
            long empty = catalog.create("Empty", List.of());
            long last = catalog.create("Last", List.of("C"));
            var statistics = factory.getStatistics();

            long beforeLazy = statistics.getPrepareStatementCount();
            factory.inTransaction(session -> {
                var orders = session.createSelectionQuery(
                        "from PurchaseOrder o order by o.id", PurchaseOrder.class).getResultList();
                assertEquals(List.of(2, 0, 1), orders.stream().map(o -> o.lines().size()).toList());
            });
            assertEquals(4, statistics.getPrepareStatementCount() - beforeLazy);

            long beforePage = statistics.getPrepareStatementCount();
            var page = catalog.pageAfter(0, 2);
            assertEquals(2, statistics.getPrepareStatementCount() - beforePage);
            assertEquals(List.of(first, empty), page.stream().map(OrderCatalog.OrderView::id).toList());
            assertEquals(List.of("A", "B"), page.getFirst().skus());
            assertEquals(List.of(), page.getLast().skus());
            assertEquals(last, catalog.pageAfter(empty, 2).getFirst().id());
            long beforeEmpty = statistics.getPrepareStatementCount();
            assertTrue(catalog.pageAfter(last, 2).isEmpty());
            assertEquals(1, statistics.getPrepareStatementCount() - beforeEmpty);
        }
    }

    @Test
    void failFastSettingRejectsCollectionFetchPagination() {
        try (var factory = LabDatabase.open()) {
            new OrderCatalog(factory).create("Order", List.of("A", "B"));
            assertThrows(HibernateException.class, () -> factory.inTransaction(session -> {
                session.createSelectionQuery("from PurchaseOrder o left join fetch o.lines", PurchaseOrder.class)
                        .setMaxResults(1).getResultList();
            }));
        }
    }

    @Test
    void capstoneRejectsStaleCommandsAndInvalidInputsWithoutChangingTheOrder() {
        try (var factory = LabDatabase.open()) {
            var catalog = new OrderCatalog(factory);
            assertThrows(IllegalArgumentException.class, () -> catalog.create("Bad", List.of("bad sku")));
            assertThrows(IllegalArgumentException.class, () -> catalog.pageAfter(0, 0));
            assertTrue(catalog.pageAfter(0, 2).isEmpty());

            long id = catalog.create("Starter order", List.of("NOTEBOOK"));
            var initial = catalog.pageAfter(0, 1).getFirst();
            assertEquals("OPEN", initial.status());
            assertThrows(NoSuchElementException.class, () -> catalog.rename(Long.MAX_VALUE, 0, "Missing"));
            catalog.rename(id, initial.version(), "Confirmed");
            assertThrows(OptimisticLockException.class, () -> catalog.rename(id, initial.version(), "Stale"));
            var committed = catalog.pageAfter(0, 1).getFirst();
            assertEquals("Confirmed", committed.label());
            assertTrue(committed.version() > initial.version());
            assertEquals(List.of("NOTEBOOK"), committed.skus());
        }
    }
}
