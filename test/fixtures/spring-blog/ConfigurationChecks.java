import java.util.Map;
import example.PaymentApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

class ConfigurationChecks {
  @Configuration(proxyBeanMethods = false)
  @EnableConfigurationProperties(PaymentApplication.PaymentConfig.class)
  static class Binding {}

  static PaymentApplication.PaymentConfig bind(String... args) {
    SpringApplication app = new SpringApplication(Binding.class);
    app.setWebApplicationType(WebApplicationType.NONE);
    app.setDefaultProperties(Map.of(
        "payment.endpoint", "https://payments.example",
        "payment.timeout", "500ms",
        "spring.main.banner-mode", "off",
        "logging.level.root", "OFF"));
    try (var context = app.run(args)) {
      return context.getBean(PaymentApplication.PaymentConfig.class);
    }
  }
  static void rejected(String... args) {
    try { bind(args); }
    catch (RuntimeException expected) { return; }
    throw new AssertionError("invalid binding accepted");
  }
  public static void main(String[] args) {
    var defaults = bind();
    if (defaults.enabled() || defaults.timeout().toMillis() != 500)
      throw new AssertionError("unsafe defaults");
    var override = bind("--payment.timeout=750ms", "--payment.enabled=true");
    if (!override.enabled() || override.timeout().toMillis() != 750)
      throw new AssertionError("command-line precedence");
    for (String endpoint : new String[]{"", "https:garbage", "http://payments.example",
        "https:///missing", "https://user:secret@payments.example", "https://payments.example/#fragment"})
      rejected("--payment.endpoint=" + endpoint);
    for (String timeout : new String[]{"", "garbage", "49ms", "5001ms", "-1ms"})
      rejected("--payment.timeout=" + timeout);
    bind("--payment.timeout=50ms");
    bind("--payment.timeout=5s");
    if (!ConfigurationRolloutExample.mayPromote(
        new ConfigurationRolloutExample.Signal(true, 0.005, 399)))
      throw new AssertionError("healthy canary rejected");
    for (double rate : new double[]{-1, Double.NaN, Double.POSITIVE_INFINITY, 0.01, 1.1})
      if (ConfigurationRolloutExample.mayPromote(
          new ConfigurationRolloutExample.Signal(true, rate, 100)))
        throw new AssertionError("invalid or failing rate promoted");
    for (int latency : new int[]{-100, 400})
      if (ConfigurationRolloutExample.mayPromote(
          new ConfigurationRolloutExample.Signal(true, 0, latency)))
        throw new AssertionError("invalid or failing latency promoted");
    if (ConfigurationRolloutExample.mayPromote(null)
        || ConfigurationRolloutExample.mayPromote(new ConfigurationRolloutExample.Signal(false, 0, 0)))
      throw new AssertionError("missing readiness promoted");
    if (new ConfigurationRolloutExample.Deployment("release-1").equals(
        new ConfigurationRolloutExample.Deployment("release-2")))
      throw new AssertionError("deployment identities lost");
    if (!ChangeControlExample.requiresRestart(ChangeControlExample.Change.TIMEOUT, false))
      throw new AssertionError("refresh assumed without implementation");
  }
}
