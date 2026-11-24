package learning.micronaut;

import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import java.time.Instant;
import java.util.UUID;

@MappedEntity("reservations")
public record Reservation(@Id UUID id, String sku, int quantity, Instant createdAt) {}
