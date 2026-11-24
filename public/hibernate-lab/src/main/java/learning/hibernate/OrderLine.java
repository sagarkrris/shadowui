package learning.hibernate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.util.Objects;

@Entity
@Table(name = "order_lines")
class OrderLine {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "line_id")
    @SequenceGenerator(name = "line_id", sequenceName = "line_id_seq", allocationSize = 10)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private PurchaseOrder order;

    @Column(nullable = false, length = 32)
    private String sku;

    protected OrderLine() {}

    OrderLine(PurchaseOrder order, String sku) {
        this.order = Objects.requireNonNull(order, "order");
        Objects.requireNonNull(sku, "sku");
        if (!sku.matches("[A-Z0-9-]{1,32}")) {
            throw new IllegalArgumentException("Invalid SKU");
        }
        this.sku = sku;
    }

    void detach() { order = null; }
    Long id() { return id; }
    String sku() { return sku; }
}
