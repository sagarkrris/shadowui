package learning.orders;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import learning.defaults.OrderClockAutoConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class OrderClockAutoConfigurationTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(OrderClockAutoConfiguration.class));

    @Test
    void suppliesAClockOnlyWhenTheApplicationHasNoClock() {
        runner.run(context -> assertThat(context).hasSingleBean(Clock.class));
        Clock fixed = Clock.fixed(Instant.EPOCH, ZoneOffset.UTC);
        runner.withBean(Clock.class, () -> fixed)
                .run(context -> assertThat(context.getBean(Clock.class)).isSameAs(fixed));
    }
}
