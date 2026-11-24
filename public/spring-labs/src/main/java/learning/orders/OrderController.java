package learning.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
class OrderController {
    private final OrderService service;

    OrderController(OrderService service) {
        this.service = service;
    }

    @GetMapping("/csrf")
    CsrfToken csrf(CsrfToken token) {
        return token;
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    OrderService.Order place(@Valid @RequestBody OrderRequest request) {
        return service.place(request.sku(), request.quantity());
    }

    @ExceptionHandler(OrderService.OrderRejected.class)
    ProblemDetail invalidQuantity(OrderService.OrderRejected exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(OrderService.StockUnavailable.class)
    ProblemDetail stockUnavailable() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Stock unavailable");
    }

    record OrderRequest(
            @NotNull @Pattern(regexp = "[A-Z0-9-]{1,32}") String sku,
            @NotNull @Min(1) Integer quantity) {}
}
