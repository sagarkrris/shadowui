package lab.checkout;

import static lab.checkout.Workflow.Kind.*;
import static lab.checkout.Workflow.Status.*;

class CheckoutWorkflowChecks {
  public static void main(String[] args) {
    transition(RESERVING, RESERVED, PAYING, CAPTURE);
    transition(RESERVING, OUT_OF_STOCK, CANCELLED, null);
    transition(PAYING, CAPTURED, CONFIRMED, null);
    transition(PAYING, DECLINED, COMPENSATING, RELEASE);
    transition(COMPENSATING, RELEASED, CANCELLED, null);
    for (var reply : new Workflow.Kind[]{RESERVED, OUT_OF_STOCK, CAPTURED, DECLINED, RELEASED}) {
      if (Workflow.advance(CONFIRMED, reply).isPresent() || Workflow.advance(CANCELLED, reply).isPresent()) {
        throw new AssertionError("A duplicate or stale reply reopened a completed order");
      }
    }
    if (Workflow.advance(COMPENSATING, CAPTURED).isPresent() || Workflow.advance(PAYING, RELEASED).isPresent()) {
      throw new AssertionError("Reply advanced an order from the wrong phase");
    }
  }

  private static void transition(Workflow.Status from, Workflow.Kind reply, Workflow.Status to, Workflow.Kind next) {
    var actual = Workflow.advance(from, reply).orElseThrow();
    if (actual.status() != to || actual.nextCommand().orElse(null) != next) {
      throw new AssertionError("Wrong transition for " + from + " and " + reply);
    }
  }
}
