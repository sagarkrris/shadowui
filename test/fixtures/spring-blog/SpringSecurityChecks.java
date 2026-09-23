import java.security.*;
import java.security.interfaces.*;
import java.time.Instant;
import java.util.*;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.*;
import org.springframework.context.annotation.*;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class SpringSecurityChecks {
  static KeyPair trusted;
  @Configuration
  @EnableWebMvc
  @Import(OrdersSecurity.class)
  static class Application {
    // Exercise the exact published validators and filter chain with a local verification
    // key; remote JWK discovery/rotation is deliberately outside this offline test.
    @Bean @Primary JwtDecoder localDecoder() {
      var decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) trusted.getPublic()).build();
      OrdersSecurity.configureClaims(decoder, "https://issuer.example", "orders-api");
      return decoder;
    }
    @Bean Controller controller() { return new Controller(); }
  }
  @RestController
  static class Controller {
    @GetMapping("/orders/example") String order() { return "ok"; }
    @GetMapping("/admin") String admin() { return "not allowed"; }
  }
  static String token(KeyPair key, String issuer, String audience, String scope,
      Instant expiry, Instant notBefore) throws Exception {
    var claims = new JWTClaimsSet.Builder().issuer(issuer).audience(audience)
        .subject("reader").claim("scope", scope).notBeforeTime(Date.from(notBefore));
    if (expiry != null) claims.expirationTime(Date.from(expiry));
    var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims.build());
    jwt.sign(new RSASSASigner((RSAPrivateKey) key.getPrivate()));
    return jwt.serialize();
  }
  static void expect(MockMvc mvc, String path, String token, int expected) throws Exception {
    var request = get(path);
    if (token != null) request.header("Authorization", "Bearer " + token);
    int actual = mvc.perform(request).andReturn().getResponse().getStatus();
    if (actual != expected) throw new AssertionError(path + ": expected " + expected + ", got " + actual);
  }
  public static void main(String[] args) throws Exception {
    var generator = KeyPairGenerator.getInstance("RSA");
    generator.initialize(2048);
    trusted = generator.generateKeyPair();
    KeyPair rogue = generator.generateKeyPair();
    try (var context = new AnnotationConfigWebApplicationContext()) {
      context.setServletContext(new MockServletContext());
      context.getEnvironment().getPropertySources().addFirst(
          new org.springframework.core.env.MapPropertySource("test", Map.of(
              "security.issuer", "https://issuer.example",
              "security.jwk-set-uri", "https://issuer.example/keys",
              "security.audience", "orders-api")));
      context.register(Application.class);
      context.refresh();
      MockMvc mvc = MockMvcBuilders.webAppContextSetup(context)
          .addFilters(context.getBean(FilterChainProxy.class)).build();
      Instant now = Instant.now();
      Instant expiry = now.plusSeconds(600), before = now.minusSeconds(10);
      String valid = token(trusted, "https://issuer.example", "orders-api", "orders.read", expiry, before);
      expect(mvc, "/orders/example", valid, 200);
      expect(mvc, "/orders/example", null, 401);
      expect(mvc, "/orders/example", token(rogue, "https://issuer.example", "orders-api", "orders.read", expiry, before), 401);
      expect(mvc, "/orders/example", token(trusted, "https://wrong.example", "orders-api", "orders.read", expiry, before), 401);
      expect(mvc, "/orders/example", token(trusted, "https://issuer.example", "wrong-api", "orders.read", expiry, before), 401);
      expect(mvc, "/orders/example", token(trusted, "https://issuer.example", "orders-api", "orders.read", now.minusSeconds(600), before), 401);
      expect(mvc, "/orders/example", token(trusted, "https://issuer.example", "orders-api", "orders.read", null, before), 401);
      expect(mvc, "/orders/example", token(trusted, "https://issuer.example", "orders-api", "orders.read", expiry, now.plusSeconds(300)), 401);
      expect(mvc, "/orders/example", token(trusted, "https://issuer.example", "orders-api", "other.scope", expiry, before), 403);
      expect(mvc, "/admin", valid, 403);
    }
  }
}
