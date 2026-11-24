package learning.micronaut;

import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Error;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import io.micronaut.scheduling.annotation.ExecuteOn;
import io.micronaut.serde.annotation.Serdeable;
import io.micronaut.validation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.UUID;

@Controller("/orders")
@ExecuteOn("lab-db")
@Validated
public class OrderController {
    private final OrderService service;

    OrderController(OrderService service) {
        this.service = service;
    }

    @Post
    public HttpResponse<OrderView> place(@Valid @Body OrderRequest request) {
        return HttpResponse.created(OrderView.of(service.place(request.sku(), request.quantity())));
    }

    @Get("/{id}")
    public HttpResponse<OrderView> find(UUID id) {
        return service.find(id).map(OrderView::of).map(HttpResponse::ok)
                .orElseGet(HttpResponse::notFound);
    }

    @Error(exception = OrderService.InvalidQuantity.class)
    public HttpResponse<OrderError> invalidQuantity() {
        return HttpResponse.badRequest(new OrderError("quantity_limit"));
    }

    @Error(exception = OrderService.StockUnavailable.class)
    public HttpResponse<OrderError> outOfStock() {
        return HttpResponse.<OrderError>status(HttpStatus.CONFLICT).body(new OrderError("stock_unavailable"));
    }

    @Serdeable
    public record OrderRequest(@NotNull @Pattern(regexp = "[A-Z0-9-]{1,32}") String sku,
                               @NotNull @Min(1) Integer quantity) {}

    @Serdeable
    public record OrderError(String code) {}

    @Serdeable
    public record OrderView(UUID id, String sku, int quantity, Instant createdAt) {
        static OrderView of(Reservation row) {
            return new OrderView(row.id(), row.sku(), row.quantity(), row.createdAt());
        }
    }
}
