package learning.hibernate;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "purchase_orders")
class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_id")
    @SequenceGenerator(name = "order_id", sequenceName = "order_id_seq", allocationSize = 10)
    private Long id;

    @Version
    private long version;

    @Column(nullable = false, length = 80)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderLine> lines = new ArrayList<>();

    protected PurchaseOrder() {}

    PurchaseOrder(String label) {
        rename(label);
    }

    void rename(String label) {
        Objects.requireNonNull(label, "label");
        if (label.isBlank() || label.length() > 80) {
            throw new IllegalArgumentException("Order label must contain 1 to 80 characters");
        }
        this.label = label;
    }

    void addLine(String sku) {
        lines.add(new OrderLine(this, sku));
    }

    void removeLine(long lineId) {
        var line = lines.stream().filter(candidate -> Objects.equals(candidate.id(), lineId))
                .findFirst().orElseThrow();
        lines.remove(line);
        line.detach();
    }

    Long id() { return id; }
    long version() { return version; }
    String label() { return label; }
    Status status() { return status; }
    List<OrderLine> lines() { return List.copyOf(lines); }

    enum Status { OPEN, CANCELLED }
}
