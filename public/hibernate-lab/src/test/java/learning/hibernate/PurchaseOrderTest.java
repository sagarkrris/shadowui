package learning.hibernate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.OptimisticLockException;
import java.util.List;
import org.hibernate.LazyInitializationException;
import org.hibernate.Transaction;
import org.junit.jupiter.api.Test;

class PurchaseOrderTest {
    @Test
    void enumMappingStoresTheNameRatherThanTheOrdinal() {
        try (var factory = LabDatabase.open()) {
            long id = new OrderCatalog(factory).create("Starter order", List.of());
            factory.inTransaction(session -> {
                assertEquals("OPEN", session.createNativeQuery(
                        "select status from purchase_orders where id = :id", String.class)
                        .setParameter("id", id).getSingleResult());
                assertEquals(PurchaseOrder.Status.OPEN, session.find(PurchaseOrder.class, id).status());
            });
        }
    }

    @Test
    void persistManagesTheOriginalAndMergeManagesTheReturnedCopy() {
        try (var factory = LabDatabase.open()) {
            var detached = new PurchaseOrder("Original");
            factory.inTransaction(session -> {
                session.persist(detached);
                assertTrue(session.contains(detached));
                assertSame(detached, session.find(PurchaseOrder.class, detached.id()));
            });
            detached.rename("Detached edit");
            factory.inTransaction(session -> {
                assertEquals("Original", session.find(PurchaseOrder.class, detached.id()).label());
                var managed = session.merge(detached);
                assertNotSame(detached, managed);
                assertFalse(session.contains(detached));
                assertTrue(session.contains(managed));
                managed.rename("Managed edit");
            });
            assertEquals("Detached edit", detached.label());
            assertEquals("Managed edit", new OrderCatalog(factory).pageAfter(0, 1).getFirst().label());
        }
    }

    @Test
    void flushSendsTheUpdateButRollbackKeepsTheCommittedState() {
        try (var factory = LabDatabase.open()) {
            long id = new OrderCatalog(factory).create("Original", List.of());
            try (var session = factory.openSession()) {
                Transaction transaction = session.beginTransaction();
                try {
                    session.find(PurchaseOrder.class, id).rename("Uncommitted");
                    long updates = factory.getStatistics().getEntityUpdateCount();
                    session.flush();
                    assertEquals(updates + 1, factory.getStatistics().getEntityUpdateCount());
                } finally {
                    transaction.rollback();
                }
            }
            assertEquals("Original", new OrderCatalog(factory).pageAfter(0, 1).getFirst().label());
        }
    }

    @Test
    void cascadePersistsTheOwningForeignKeyAndRemovingAnOrphanDeletesIt() {
        try (var factory = LabDatabase.open()) {
            long id = new OrderCatalog(factory).create("With lines", List.of("A", "B"));
            long removedId = factory.fromTransaction(session -> {
                var order = session.find(PurchaseOrder.class, id);
                var line = order.lines().getFirst();
                assertEquals(id, session.createNativeQuery(
                        "select order_id from order_lines where id = :id", Long.class)
                        .setParameter("id", line.id()).getSingleResult());
                order.removeLine(line.id());
                return line.id();
            });
            factory.inTransaction(session -> {
                assertNull(session.find(OrderLine.class, removedId));
                assertEquals(List.of("B"), session.find(PurchaseOrder.class, id).lines().stream()
                        .map(OrderLine::sku).toList());
            });
        }
    }

    @Test
    void uninitializedCollectionNeedsAnOpenSession() {
        try (var factory = LabDatabase.open()) {
            long id = new OrderCatalog(factory).create("Lazy", List.of("A"));
            var detached = factory.fromTransaction(session -> session.find(PurchaseOrder.class, id));
            assertThrows(LazyInitializationException.class, detached::lines);
        }
    }

    @Test
    void staleWriterCannotOverwriteTheCommittedWinner() {
        try (var factory = LabDatabase.open()) {
            long id = new OrderCatalog(factory).create("Original", List.of());
            try (var first = factory.openSession(); var second = factory.openSession()) {
                var winningTransaction = first.beginTransaction();
                var staleTransaction = second.beginTransaction();
                try {
                    var winner = first.find(PurchaseOrder.class, id);
                    var stale = second.find(PurchaseOrder.class, id);
                    long initialVersion = winner.version();
                    assertEquals(initialVersion, stale.version());
                    winner.rename("Winner");
                    winningTransaction.commit();
                    assertTrue(winner.version() > initialVersion);

                    stale.rename("Stale");
                    assertThrows(OptimisticLockException.class, second::flush);
                } finally {
                    if (staleTransaction.isActive()) staleTransaction.rollback();
                    if (winningTransaction.isActive()) winningTransaction.rollback();
                }
            }
            assertEquals("Winner", new OrderCatalog(factory).pageAfter(0, 1).getFirst().label());
        }
    }

    @Test
    void bulkUpdatesLeaveManagedStateStaleUntilRefreshed() {
        try (var factory = LabDatabase.open()) {
            long id = new OrderCatalog(factory).create("Original", List.of());
            factory.inTransaction(session -> {
                var order = session.find(PurchaseOrder.class, id);
                long version = order.version();
                assertEquals(1, session.createMutationQuery("""
                        update PurchaseOrder o set o.label = :label where o.id = :id
                        """).setParameter("label", "Bulk edit").setParameter("id", id).executeUpdate());
                assertEquals("Original", order.label());
                session.refresh(order);
                assertEquals("Bulk edit", order.label());
                assertEquals(version, order.version());
            });
        }
    }
}
