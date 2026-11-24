package learning.micronaut;

import io.micronaut.data.annotation.Query;
import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;
import java.util.UUID;

@JdbcRepository(dialect = Dialect.H2)
public interface ReservationRepository extends CrudRepository<Reservation, UUID> {
    @Query("update stock set remaining = remaining - :quantity where sku = :sku and remaining >= :quantity")
    long reserveStock(String sku, int quantity);
}
