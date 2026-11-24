package learning.micronaut;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.micronaut.context.ApplicationContext;
import io.micronaut.context.annotation.Replaces;
import io.micronaut.context.annotation.Requires;
import io.micronaut.json.JsonMapper;
import io.micronaut.data.jdbc.runtime.JdbcOperations;
import io.micronaut.runtime.server.EmbeddedServer;
import jakarta.inject.Singleton;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.junit.jupiter.api.Test;

class OrderControllerTest {
    @Test
    void validatesJsonOffloadsJdbcAndAllowsOnlyOneCompetingReservation() throws Exception {
        try (var context = context(); var client = HttpClient.newHttpClient()) {
            var server = context.getBean(EmbeddedServer.class).start();
            var bodyHandler = HttpResponse.BodyHandlers.ofString();
            assertEquals(400, client.send(post(server.getURI(), "{"), bodyHandler).statusCode());
            assertEquals(400, client.send(post(server.getURI(), """
                    {"sku":"NOTEBOOK"}
                    """), bodyHandler).statusCode());
            var invalid = client.send(post(server.getURI(), payload(6)), bodyHandler);
            assertEquals(400, invalid.statusCode());
            assertTrue(invalid.body().contains("quantity_limit"));

            var first = client.sendAsync(post(server.getURI(), payload(3)), bodyHandler);
            var second = client.sendAsync(post(server.getURI(), payload(3)), bodyHandler);
            var a = first.join();
            var b = second.join();
            var created = a.statusCode() == 201 ? a : b;
            assertEquals(201, created.statusCode());
            var conflict = a.statusCode() == 201 ? b : a;
            assertEquals(409, conflict.statusCode());
            assertTrue(conflict.body().contains("stock_unavailable"));
            var view = context.getBean(JsonMapper.class).readValue(created.body(), OrderController.OrderView.class);
            assertEquals(3, view.quantity());
            assertEquals(Instant.EPOCH, view.createdAt());
            assertEquals(200, client.send(get(server.getURI(), view.id()), bodyHandler).statusCode());
            assertEquals(404, client.send(get(server.getURI(), UUID.randomUUID()), bodyHandler).statusCode());

            var clock = context.getBean(RecordingClock.class);
            assertEquals(1, clock.threadNames.size());
            assertTrue(clock.threadNames.element().startsWith("lab-db-"), clock.threadNames.toString());
            var database = context.getBean(JdbcOperations.class);
            assertEquals(2, scalar(database, "select remaining from stock where sku = 'NOTEBOOK'"));
            assertEquals(1, scalar(database, "select count(*) from reservations"));
        }
    }

    @Test
    void transactionRollsBackTheStockUpdateWhenSavingTheReservationFails() throws Exception {
        try (var context = context()) {
            var database = context.getBean(JdbcOperations.class);
            database.execute(connection -> {
                try (var sql = connection.createStatement()) {
                    return sql.execute("alter table reservations add constraint reject_pencil check (sku <> 'PENCIL')");
                }
            });
            var service = context.getBean(OrderService.class);
            assertThrows(io.micronaut.data.exceptions.DataAccessException.class, () -> service.place("PENCIL", 1));
            assertEquals(2, scalar(database, "select remaining from stock where sku = 'PENCIL'"));
            assertEquals(0, scalar(database, "select count(*) from reservations"));
        }
    }

    private static ApplicationContext context() {
        var properties = new HashMap<>(FrameworkMechanicsTest.isolatedDatabase());
        properties.put("micronaut.server.port", -1);
        return ApplicationContext.run(properties, "http-lab");
    }

    private static int scalar(JdbcOperations database, String query) {
        return database.execute(connection -> {
            try (var sql = connection.createStatement(); var rows = sql.executeQuery(query)) {
                if (!rows.next()) throw new SQLException("Expected one row");
                return rows.getInt(1);
            }
        });
    }

    private static String payload(int quantity) {
        return """
                {"sku":"NOTEBOOK","quantity":%d}
                """.formatted(quantity);
    }

    private static HttpRequest post(URI server, String body) {
        return HttpRequest.newBuilder(server.resolve("/orders")).timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
    }

    private static HttpRequest get(URI server, UUID id) {
        return HttpRequest.newBuilder(server.resolve("/orders/" + id)).timeout(Duration.ofSeconds(10)).GET().build();
    }

    @Singleton
    @Requires(env = "http-lab")
    @Replaces(Clock.class)
    static class RecordingClock extends Clock {
        private final ConcurrentLinkedQueue<String> threadNames = new ConcurrentLinkedQueue<>();

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(Instant.EPOCH, zone); }

        @Override
        public Instant instant() {
            threadNames.add(Thread.currentThread().getName());
            return Instant.EPOCH;
        }
    }
}
