package learning.orders;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

class AnnotationExecutionTest {
    @Test
    void cacheHitSkipsTheTargetButSelfInvocationDoesNot() {
        try (var context = new AnnotationConfigApplicationContext(ExecutionConfiguration.class)) {
            var catalog = context.getBean(Catalog.class);
            assertThat(catalog.descriptionVersion("NOTEBOOK")).isEqualTo(1);
            assertThat(catalog.descriptionVersion("NOTEBOOK")).isEqualTo(1);
            assertThat(catalog.directDescriptionVersion("NOTEBOOK")).isEqualTo(2);
            assertThat(catalog.descriptionVersion("NOTEBOOK")).isEqualTo(1);
        }
    }

    @Test
    void asyncAdviceUsesTheExecutorOnlyWhenTheCallCrossesTheProxy() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(ExecutionConfiguration.class)) {
            var catalog = context.getBean(Catalog.class);
            assertThat(catalog.workerName().get(5, TimeUnit.SECONDS)).startsWith("orders-worker-");
            assertThat(catalog.directWorkerName().get(5, TimeUnit.SECONDS))
                    .isEqualTo(Thread.currentThread().getName());
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableCaching(proxyTargetClass = true)
    @EnableAsync(proxyTargetClass = true)
    static class ExecutionConfiguration {
        @Bean
        Catalog catalog() {
            return new Catalog();
        }

        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("descriptions");
        }

        @Bean
        ThreadPoolTaskExecutor taskExecutor() {
            var executor = new ThreadPoolTaskExecutor();
            executor.setCorePoolSize(1);
            executor.setMaxPoolSize(1);
            executor.setQueueCapacity(1);
            executor.setThreadNamePrefix("orders-worker-");
            return executor;
        }
    }

    static class Catalog {
        private final AtomicInteger calls = new AtomicInteger();

        @Cacheable("descriptions")
        public int descriptionVersion(String sku) {
            return calls.incrementAndGet();
        }

        public int directDescriptionVersion(String sku) {
            return this.descriptionVersion(sku);
        }

        @Async
        public CompletableFuture<String> workerName() {
            return CompletableFuture.completedFuture(Thread.currentThread().getName());
        }

        public CompletableFuture<String> directWorkerName() {
            return this.workerName();
        }
    }
}
