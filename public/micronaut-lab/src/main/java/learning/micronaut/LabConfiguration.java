package learning.micronaut;

import io.micronaut.context.annotation.Context;
import io.micronaut.context.annotation.Factory;
import io.micronaut.context.annotation.Requires;
import io.micronaut.context.annotation.Value;
import io.micronaut.data.jdbc.runtime.JdbcOperations;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import jakarta.inject.Singleton;

@Factory
class LabConfiguration {
    @Context
    OrderPolicy policy(@Value("${orders.max-quantity:5}") int limit) {
        return new OrderPolicy(limit);
    }

    @Singleton
    @Requires(property = "orders.clock", value = "system", defaultValue = "system")
    Clock systemClock() {
        return Clock.systemUTC();
    }

    @Singleton
    @Requires(property = "orders.clock", value = "fixed")
    Clock fixedClock() {
        return Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    }

    // Eager local fixture setup. Production schema evolution belongs in migrations.
    @Context
    DemoSchema demoSchema(JdbcOperations jdbc) {
        return jdbc.execute(connection -> {
            try (var statement = connection.createStatement()) {
                statement.execute("""
                        create table stock (sku varchar(32) primary key, remaining int not null check (remaining >= 0))
                        """);
                statement.execute("""
                        create table reservations (id uuid primary key, sku varchar(32) not null references stock(sku),
                            quantity int not null check (quantity > 0), created_at timestamp with time zone not null)
                        """);
                statement.execute("insert into stock (sku, remaining) values ('NOTEBOOK', 5), ('PENCIL', 2)");
            }
            return new DemoSchema();
        });
    }

    record DemoSchema() {}
}
