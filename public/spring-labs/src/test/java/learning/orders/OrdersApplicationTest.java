package learning.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.security.user.password=integration-only")
class OrdersApplicationTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    @Autowired OrderService service;
    @Autowired ObjectMapper json;

    @Test
    void rollsBackStockWhenTheOrderInsertFails() {
        jdbc.execute("alter table orders add constraint reject_pencil check (sku <> 'PENCIL')");
        try {
            assertThatThrownBy(() -> service.place("PENCIL", 1))
                    .isInstanceOf(DataIntegrityViolationException.class);
            assertThat(jdbc.queryForObject(
                    "select remaining from inventory where sku = 'PENCIL'", Integer.class)).isEqualTo(2);
            assertThat(jdbc.queryForObject(
                    "select count(*) from orders where sku = 'PENCIL'", Integer.class)).isZero();
        } finally {
            jdbc.execute("alter table orders drop constraint reject_pencil");
        }
    }

    @Test
    void checksHttpSecurityValidationAndConcurrentStock() throws Exception {
        try (var client = HttpClient.newBuilder().cookieHandler(new CookieManager())
                .connectTimeout(java.time.Duration.ofSeconds(5)).build()) {
            assertThat(client.send(request("/csrf").GET().build(),
                    HttpResponse.BodyHandlers.discarding()).statusCode()).isEqualTo(401);
            assertThat(client.send(request("/actuator/health").GET().build(),
                    HttpResponse.BodyHandlers.ofString()).body()).contains("UP");
            var tokenResponse = client.send(authorized("/csrf").GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(tokenResponse.statusCode()).isEqualTo(200);
            var token = json.readTree(tokenResponse.body());

            assertThat(client.send(orderRequest(3).build(),
                    HttpResponse.BodyHandlers.discarding()).statusCode()).isEqualTo(403);
            assertThat(post(client, token.get("headerName").asString(),
                    token.get("token").asString(), 0).join()).isEqualTo(400);
            assertThat(post(client, token.get("headerName").asString(),
                    token.get("token").asString(), 6).join()).isEqualTo(400);
            var first = post(client, token.get("headerName").asString(), token.get("token").asString(), 3);
            var second = post(client, token.get("headerName").asString(), token.get("token").asString(), 3);
            assertThat(new Integer[] {first.join(), second.join()}).containsExactlyInAnyOrder(201, 409);
            assertThat(jdbc.queryForObject(
                    "select remaining from inventory where sku = 'NOTEBOOK'", Integer.class)).isEqualTo(2);
            assertThat(jdbc.queryForObject(
                    "select count(*) from orders where sku = 'NOTEBOOK'", Integer.class)).isEqualTo(1);
        }
    }

    private CompletableFuture<Integer> post(HttpClient client, String header, String token, int quantity) {
        return client.sendAsync(orderRequest(quantity).header(header, token).build(),
                HttpResponse.BodyHandlers.discarding()).thenApply(HttpResponse::statusCode);
    }

    private HttpRequest.Builder orderRequest(int quantity) {
        return authorized("/orders").header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"sku":"NOTEBOOK","quantity":%d}
                        """.formatted(quantity)));
    }

    private HttpRequest.Builder authorized(String path) {
        String credentials = Base64.getEncoder().encodeToString(
                "learner:integration-only".getBytes(StandardCharsets.UTF_8));
        return request(path).header("Authorization", "Basic " + credentials);
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(java.time.Duration.ofSeconds(10));
    }
}
