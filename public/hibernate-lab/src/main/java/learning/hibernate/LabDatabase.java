package learning.hibernate;

import java.util.UUID;
import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;

final class LabDatabase {
    private LabDatabase() {}

    static SessionFactory open() {
        var registry = new StandardServiceRegistryBuilder()
                .applySetting("jakarta.persistence.jdbc.driver", "org.h2.Driver")
                .applySetting("jakarta.persistence.jdbc.url", "jdbc:h2:mem:orders-" + UUID.randomUUID())
                .applySetting("hibernate.hbm2ddl.auto", "create-drop")
                .applySetting("hibernate.generate_statistics", "true")
                .applySetting("hibernate.session.events.log", "false")
                .applySetting("hibernate.query.fail_on_pagination_over_collection_fetch", "true")
                .build();
        try {
            return new MetadataSources(registry)
                    .addAnnotatedClass(PurchaseOrder.class)
                    .addAnnotatedClass(OrderLine.class)
                    .buildMetadata()
                    .buildSessionFactory();
        } catch (RuntimeException failure) {
            StandardServiceRegistryBuilder.destroy(registry);
            throw failure;
        }
    }
}
