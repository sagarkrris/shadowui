package learning.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;

class OrderServiceTest {
    @Test
    void wiresAnOrderServiceInAPlainSpringContext() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        var database = new EmbeddedDatabaseBuilder().generateUniqueName(true)
                .setType(EmbeddedDatabaseType.H2).addScript("schema.sql")
                .build();
        var jdbc = new JdbcTemplate(database);
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(OrderStore.class, () -> new OrderStore(jdbc));
            context.registerBean(OrderPolicy.class, () -> new OrderPolicy(5));
            context.registerBean(Clock.class, () -> Clock.fixed(now, ZoneOffset.UTC));
            context.register(OrderService.class);
            context.refresh();

            var service = context.getBean(OrderService.class);
            assertThat(context.getBean(OrderService.class)).isSameAs(service);
            var order = service.place("NOTEBOOK", 2);
            assertThat(order.placedAt()).isEqualTo(now);
            assertThat(jdbc.queryForObject("select count(*) from orders", Integer.class)).isEqualTo(1);
            assertThatThrownBy(() -> service.place("NOTEBOOK", 6))
                    .isInstanceOf(OrderService.OrderRejected.class);
        } finally {
            database.shutdown();
        }
    }
}
