package learning.micronaut;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.micronaut.aop.Around;
import io.micronaut.aop.InterceptorBean;
import io.micronaut.aop.MethodInterceptor;
import io.micronaut.aop.MethodInvocationContext;
import io.micronaut.context.ApplicationContext;
import io.micronaut.context.annotation.Requires;
import io.micronaut.core.beans.BeanIntrospection;
import jakarta.inject.Singleton;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FrameworkMechanicsTest {
    static Map<String, Object> isolatedDatabase() {
        return Map.of("datasources.default.url", "jdbc:h2:mem:lab-" + UUID.randomUUID());
    }

    @Test
    void configurationSelectsOneGeneratedFactoryBean() {
        try (var context = ApplicationContext.run(Map.of("orders.clock", "fixed",
                "datasources.default.url", "jdbc:h2:mem:fixed-" + UUID.randomUUID()))) {
            assertEquals(1, context.getBeansOfType(Clock.class).size());
            assertEquals(Instant.parse("2026-01-01T00:00:00Z"), context.getBean(Clock.class).instant());
            var constructor = context.getBeanDefinition(OrderService.class).getConstructor();
            var argumentTypes = Arrays.stream(constructor.getArguments())
                    .map(argument -> argument.getType()).collect(Collectors.toSet());
            assertTrue(argumentTypes.containsAll(Set.of(ReservationRepository.class, OrderPolicy.class, Clock.class)));
            assertTrue(argumentTypes.size() > 3, "The intercepted bean also needs infrastructure arguments");
        }
        try (var context = ApplicationContext.run(Map.of("orders.clock", "unsupported",
                "datasources.default.url", "jdbc:h2:mem:unsupported-" + UUID.randomUUID()))) {
            assertTrue(context.getBeansOfType(Clock.class).isEmpty());
            assertThrows(RuntimeException.class, () -> context.getBean(OrderService.class));
        }
    }

    @Test
    void invalidConfigurationFailsAtEagerPolicyCreation() {
        var failure = assertThrows(RuntimeException.class, () -> {
            try (var context = ApplicationContext.run(Map.of("orders.max-quantity", 0,
                    "datasources.default.url", "jdbc:h2:mem:invalid-" + UUID.randomUUID()))) {
                context.getBean(OrderPolicy.class);
            }
        });
        assertTrue(failure.getMessage().contains("Maximum quantity"));
    }

    @Test
    void generatedIntrospectionReadsRecordProperties() {
        var introspection = BeanIntrospection.getIntrospection(OrderController.OrderRequest.class);
        var request = new OrderController.OrderRequest("NOTEBOOK", 3);
        assertEquals(3, introspection.getRequiredProperty("quantity", Integer.class).get(request));
    }

    @Test
    void eligibleSelfCallDispatchesThroughTheDefaultGeneratedSubclass() {
        try (var context = ApplicationContext.run(isolatedDatabase(), "advice-lab")) {
            var bean = context.getBean(Example.class);
            assertEquals("advised:value", bean.value());
            assertEquals("advised:value", bean.callFromSameClass());
            assertEquals("value", new Example().callFromSameClass());
            assertFalse(bean.getClass().equals(Example.class));
        }
    }

    @Around
    @Retention(RetentionPolicy.RUNTIME)
    @interface MarkCall {}

    @Singleton
    @Requires(env = "advice-lab")
    static class Example {
        public String callFromSameClass() {
            return this.value();
        }

        @MarkCall
        public String value() {
            return "value";
        }
    }

    @Singleton
    @InterceptorBean(MarkCall.class)
    @Requires(env = "advice-lab")
    static class Marker implements MethodInterceptor<Object, Object> {
        @Override
        public Object intercept(MethodInvocationContext<Object, Object> context) {
            return "advised:" + context.proceed();
        }
    }
}
