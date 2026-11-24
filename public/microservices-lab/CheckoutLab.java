import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;

import static java.nio.file.StandardCopyOption.ATOMIC_MOVE;
import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;
import static java.nio.file.StandardOpenOption.CREATE;
import static java.nio.file.StandardOpenOption.WRITE;

/**
 * A restartable checkout lab with one order per directory and separate owner checkpoints.
 * Run with Java 17 using the commands in the course.
 */
public class CheckoutLab {
  enum Order { ABSENT, RESERVING, PAYING, COMPENSATING, CONFIRMED, CANCELLED }
  enum Stock { AVAILABLE, RESERVED, RELEASED }
  enum Payment { UNKNOWN, CAPTURED, DECLINED }
  enum Decision { APPROVE, DECLINE }
  enum Fault { NONE, LOSE_REPLY, FAIL_RELEASE }

  private final Path directory;

  CheckoutLab(Path directory) {
    this.directory = directory;
  }

  public static void main(String[] args) throws IOException {
    if (args.length < 2 || args.length > 3) {
      throw new IllegalArgumentException("Usage: CheckoutLab <directory> place|step|status [APPROVE|DECLINE|LOSE_REPLY|FAIL_RELEASE]");
    }
    Path directory = Files.createDirectories(Path.of(args[0]));
    try (var channel = FileChannel.open(directory.resolve("lab.lock"), CREATE, WRITE);
         var lock = channel.tryLock()) {
      if (lock == null) throw new IllegalStateException("Another command owns the lab");
      var lab = new CheckoutLab(directory);
      switch (args[1]) {
        case "place" -> lab.place(Decision.valueOf(argument(args, 3)));
        case "step" -> lab.step(args.length == 3 ? Fault.valueOf(args[2]) : Fault.NONE);
        case "status" -> argument(args, 2);
        default -> throw new IllegalArgumentException("Unknown command: " + args[1]);
      }
      System.out.println(lab.status());
    }
  }

  private static String argument(String[] args, int length) {
    if (args.length != length) throw new IllegalArgumentException("Wrong number of arguments");
    return args[length - 1];
  }

  private void place(Decision decision) throws IOException {
    var current = readOrder();
    if (current.state() == Order.ABSENT) {
      saveOrder(Order.RESERVING, decision);
    } else if (current.decision() != decision) {
      throw new IllegalArgumentException("The existing order has a different payment scenario");
    }
  }

  private void step(Fault fault) throws IOException {
    var current = readOrder();
    if (fault == Fault.FAIL_RELEASE && current.state() != Order.COMPENSATING ||
        fault == Fault.LOSE_REPLY && current.state() != Order.RESERVING && current.state() != Order.PAYING) {
      throw new IllegalArgumentException("Fault does not apply to the current order state");
    }
    switch (current.state()) {
      case ABSENT -> throw new IllegalStateException("Place an order before delivering work");
      case RESERVING -> {
        reserve();
        if (!lostReply(fault)) saveOrder(Order.PAYING, current.decision());
      }
      case PAYING -> {
        // Query the authoritative payment checkpoint before deciding to compensate.
        var outcome = captureOrRead(current.decision());
        if (!lostReply(fault)) {
          saveOrder(outcome == Payment.CAPTURED ? Order.CONFIRMED : Order.COMPENSATING, current.decision());
        }
      }
      case COMPENSATING -> {
        if (fault == Fault.FAIL_RELEASE) {
          System.out.println("Release failed before commit. The command remains pending.");
          return;
        }
        release();
        saveOrder(Order.CANCELLED, current.decision());
      }
      case CONFIRMED, CANCELLED -> { /* No pending work. */ }
    }
  }

  private static boolean lostReply(Fault fault) {
    if (fault != Fault.LOSE_REPLY) return false;
    System.out.println("Owner committed. The relay lost the reply before advancing Orders.");
    return true;
  }

  private void reserve() throws IOException {
    switch (readStock()) {
      case AVAILABLE -> save("inventory", Stock.RESERVED.name());
      case RESERVED -> { /* Prior reservation result for this workflow. */ }
      case RELEASED -> throw new IllegalStateException("Cannot reserve released stock");
    }
  }

  private void release() throws IOException {
    switch (readStock()) {
      case RESERVED -> save("inventory", Stock.RELEASED.name());
      case RELEASED -> { /* Prior compensation result. */ }
      case AVAILABLE -> throw new IllegalStateException("Nothing to release");
    }
  }

  private Payment captureOrRead(Decision decision) throws IOException {
    var outcome = readPayment();
    if (outcome == Payment.UNKNOWN) {
      outcome = decision == Decision.APPROVE ? Payment.CAPTURED : Payment.DECLINED;
      save("payment", outcome.name());
    }
    return outcome;
  }

  private record OrderCheckpoint(Order state, Decision decision) {}

  private OrderCheckpoint readOrder() throws IOException {
    String value = read("orders", "");
    if (value.isEmpty()) return new OrderCheckpoint(Order.ABSENT, null);
    String[] fields = value.split("\\|", -1);
    if (fields.length != 2 || Order.valueOf(fields[0]) == Order.ABSENT) {
      throw new IllegalStateException("Invalid order checkpoint");
    }
    return new OrderCheckpoint(Order.valueOf(fields[0]), Decision.valueOf(fields[1]));
  }

  private void saveOrder(Order state, Decision decision) throws IOException {
    // In this bounded lab, the state also identifies the single pending command.
    save("orders", state.name() + "|" + decision.name());
  }

  private Stock readStock() throws IOException {
    return Stock.valueOf(read("inventory", Stock.AVAILABLE.name()));
  }

  private Payment readPayment() throws IOException {
    return Payment.valueOf(read("payment", Payment.UNKNOWN.name()));
  }

  private String status() throws IOException {
    return "order=" + readOrder().state() + " stock=" + readStock() + " payment=" + readPayment();
  }

  private String read(String owner, String absentValue) throws IOException {
    try {
      return Files.readString(directory.resolve(owner));
    } catch (java.nio.file.NoSuchFileException absent) {
      return absentValue;
    }
  }

  private void save(String owner, String value) throws IOException {
    Path staged = Files.createTempFile(directory, owner, ".tmp");
    try {
      Files.writeString(staged, value);
      Files.move(staged, directory.resolve(owner), ATOMIC_MOVE, REPLACE_EXISTING);
    } finally {
      Files.deleteIfExists(staged);
    }
  }
}
