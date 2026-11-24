package learning.orders;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
class OrderSecurity {
    @Bean
    SecurityFilterChain ordersSecurity(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(requests -> requests
                        // Allow internal error dispatches to preserve the original status.
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/csrf").hasRole("ORDER_WRITER")
                        .requestMatchers(HttpMethod.POST, "/orders").hasRole("ORDER_WRITER")
                        .anyRequest().denyAll())
                .httpBasic(Customizer.withDefaults())
                .build();
    }
}
