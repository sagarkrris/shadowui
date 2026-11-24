package learning.hibernate;

import jakarta.persistence.OptimisticLockException;
import java.util.HashMap;
import java.util.List;
import java.util.NoSuchElementException;
import org.hibernate.SessionFactory;

final class OrderCatalog {
    private final SessionFactory factory;

    OrderCatalog(SessionFactory factory) {
        this.factory = factory;
    }

    long create(String label, List<String> skus) {
        return factory.fromTransaction(session -> {
            var order = new PurchaseOrder(label);
            skus.forEach(order::addLine);
            session.persist(order);
            return order.id(); // This lab uses a sequence-generated identifier.
        });
    }

    List<OrderView> pageAfter(long afterId, int size) {
        if (afterId < 0 || size < 1 || size > 50) {
            throw new IllegalArgumentException("Use an after ID >= 0 and a page size between 1 and 50");
        }
        return factory.fromTransaction(session -> {
            var ids = session.createSelectionQuery("""
                    select o.id from PurchaseOrder o where o.id > :after order by o.id
                    """, Long.class).setParameter("after", afterId).setMaxResults(size).getResultList();
            if (ids.isEmpty()) return List.of();

            var orders = session.createSelectionQuery("""
                    select o from PurchaseOrder o left join fetch o.lines where o.id in :ids
                    """, PurchaseOrder.class).setParameterList("ids", ids).getResultList();
            var byId = new HashMap<Long, OrderView>();
            orders.forEach(order -> byId.put(order.id(), view(order)));
            // A delete between the queries can make a selected ID disappear at READ COMMITTED.
            return ids.stream().filter(byId::containsKey).map(byId::get).toList();
        });
    }

    void rename(long id, long expectedVersion, String label) {
        factory.inTransaction(session -> {
            var order = session.find(PurchaseOrder.class, id);
            if (order == null) throw new NoSuchElementException("Order " + id);
            if (order.version() != expectedVersion) throw new OptimisticLockException("Order version changed");
            order.rename(label);
        });
    }

    private static OrderView view(PurchaseOrder order) {
        return new OrderView(order.id(), order.version(), order.label(), order.status().name(),
                order.lines().stream().map(OrderLine::sku).toList());
    }

    record OrderView(long id, long version, String label, String status, List<String> skus) {}
}
