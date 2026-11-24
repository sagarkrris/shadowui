package learning.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class TransactionBoundaryTest {
    private AnnotationConfigApplicationContext context;
    private Writes writes;
    private Workflow workflow;
    private JdbcTemplate jdbc;

    @BeforeEach
    void openContext() {
        context = new AnnotationConfigApplicationContext(LabConfiguration.class);
        writes = context.getBean(Writes.class);
        workflow = context.getBean(Workflow.class);
        jdbc = context.getBean(JdbcTemplate.class);
        jdbc.execute("create table entries (label varchar(32) primary key)");
    }

    @AfterEach
    void closeContext() {
        context.close();
    }

    @Test
    void selfInvocationWithoutAnOuterTransactionLeavesTheWriteCommitted() {
        assertThatThrownBy(writes::selfWithoutOuter).isInstanceOf(IllegalStateException.class);
        assertEntries("inner");
    }

    @Test
    void externalInvocationAppliesRollback() {
        assertThatThrownBy(() -> writes.writeThenFail(true)).isInstanceOf(IllegalStateException.class);
        assertEntries();
    }

    @Test
    void selfInvocationUsesTheOuterTransactionAndIgnoresRequiresNew() {
        assertThatThrownBy(writes::selfWithOuter).isInstanceOf(IllegalStateException.class);
        assertEntries();
    }

    @Test
    void externalRequiresNewCommitsIndependentlyFromTheOuterTransaction() {
        assertThatThrownBy(workflow::separateCommitThenFail).isInstanceOf(IllegalStateException.class);
        assertEntries("independent");
    }

    @Test
    void caughtFailureFromParticipatingProxyStillMarksTheOuterTransactionRollbackOnly() {
        assertThatThrownBy(workflow::catchParticipatingFailure)
                .isInstanceOf(UnexpectedRollbackException.class);
        assertEntries();
    }

    @Test
    void caughtFailureFromSelfInvocationDoesNotApplyTheInnerRollbackRule() {
        writes.catchSelfInvocationFailure();
        assertEntries("inner");
    }

    @Test
    void checkedExceptionsCommitByDefaultUnlessTheRuleRequestsRollback() {
        assertThatThrownBy(() -> writes.checkedFailure("default")).isInstanceOf(CheckedFailure.class);
        assertThatThrownBy(writes::rollbackCheckedFailure).isInstanceOf(CheckedFailure.class);
        assertEntries("default");
    }

    private void assertEntries(String... expected) {
        assertThat(jdbc.queryForList("select label from entries order by label", String.class))
                .containsExactly(expected);
    }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement(proxyTargetClass = true)
    static class LabConfiguration {
        @Bean(destroyMethod = "shutdown")
        EmbeddedDatabase dataSource() {
            return new EmbeddedDatabaseBuilder().generateUniqueName(true)
                    .setType(EmbeddedDatabaseType.H2).build();
        }

        @Bean
        JdbcTemplate jdbcTemplate(DataSource dataSource) {
            return new JdbcTemplate(dataSource);
        }

        @Bean
        DataSourceTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        Writes writes(JdbcTemplate jdbc) {
            return new Writes(jdbc);
        }

        @Bean
        Workflow workflow(Writes writes, JdbcTemplate jdbc) {
            return new Workflow(writes, jdbc);
        }
    }

    static class Writes {
        private final JdbcTemplate jdbc;

        Writes(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        public void selfWithoutOuter() {
            this.writeThenFail(false);
        }

        @Transactional
        public void selfWithOuter() {
            this.writeIndependently();
            throw new IllegalStateException("fail after inner returns");
        }

        @Transactional
        public void catchSelfInvocationFailure() {
            try {
                this.writeThenFail(true);
            } catch (IllegalStateException expected) {
                // No inner transaction interceptor observed this exception.
            }
        }

        @Transactional
        public void writeThenFail(boolean expectsTransaction) {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive())
                    .isEqualTo(expectsTransaction);
            jdbc.update("insert into entries values (?)", "inner");
            throw new IllegalStateException("fail after insert");
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void writeIndependently() {
            jdbc.update("insert into entries values (?)", "independent");
        }

        @Transactional
        public void checkedFailure(String label) throws CheckedFailure {
            jdbc.update("insert into entries values (?)", label);
            throw new CheckedFailure();
        }

        @Transactional(rollbackFor = CheckedFailure.class)
        public void rollbackCheckedFailure() throws CheckedFailure {
            this.checkedFailure("explicit");
        }
    }

    static class Workflow {
        private final Writes writes;
        private final JdbcTemplate jdbc;

        Workflow(Writes writes, JdbcTemplate jdbc) {
            this.writes = writes;
            this.jdbc = jdbc;
        }

        @Transactional
        public void separateCommitThenFail() {
            jdbc.update("insert into entries values (?)", "outer");
            writes.writeIndependently();
            throw new IllegalStateException("fail after independent commit");
        }

        @Transactional
        public void catchParticipatingFailure() {
            try {
                writes.writeThenFail(true);
            } catch (IllegalStateException expected) {
                // The participating interceptor has already requested rollback.
            }
        }
    }

    static class CheckedFailure extends Exception {}
}
