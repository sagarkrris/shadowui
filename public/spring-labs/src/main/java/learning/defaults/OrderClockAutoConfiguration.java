package learning.defaults;

import java.time.Clock;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class OrderClockAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean(Clock.class)
    Clock orderClock() {
        return Clock.systemUTC();
    }
}
