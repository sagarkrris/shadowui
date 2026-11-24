package learning.micronaut;

public record OrderPolicy(int maxQuantity) {
    public OrderPolicy {
        if (maxQuantity < 1 || maxQuantity > 100) {
            throw new IllegalArgumentException("Maximum quantity must be between 1 and 100");
        }
    }

    public boolean allows(int quantity) {
        return quantity >= 1 && quantity <= maxQuantity;
    }
}
