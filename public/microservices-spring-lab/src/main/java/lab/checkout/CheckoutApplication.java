package lab.checkout;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.util.backoff.FixedBackOff;

@SpringBootApplication
@EnableScheduling
public class CheckoutApplication {
    public static void main(String[] args) {
        SpringApplication.run(CheckoutApplication.class, args);
    }

    @Bean
    KafkaAdmin.NewTopics checkoutTopics() {
        return new KafkaAdmin.NewTopics(
                TopicBuilder.name(Workflow.ORDERS).partitions(1).replicas(1).build(),
                TopicBuilder.name(Workflow.INVENTORY).partitions(1).replicas(1).build(),
                TopicBuilder.name(Workflow.PAYMENT).partitions(1).replicas(1).build());
    }

    @Bean
    DefaultErrorHandler checkoutErrors() {
        return new DefaultErrorHandler(new FixedBackOff(500, FixedBackOff.UNLIMITED_ATTEMPTS));
    }
}
