export function buildJavaProgramRunner(program = {}) {
  const title = String(program.title || 'Java exercise').replace(/[\r\n]/g, ' ');
  const reverse = program.id === 'program-1' && title === 'Reverse a string';
  return {
    title,
    prompt: program.prompt || `Implement ${title} and explain its contract and boundary cases.`,
    instructions: reverse
      ? 'Implement reverse(String): reverse Unicode code points, return an empty string for empty input, and reject null with IllegalArgumentException. Run Main to check normal, empty, supplementary-character, and null cases.'
      : 'This is an editable standalone Main.java scaffold for the selected exercise, not a supplied solution or an automated correctness check. Add your implementation and assertions. Framework, database, HTTP-service, and external-tool exercises need a configured local project; the online runner supplies only the Java runtime and standard library.',
    javaVersion: 17,
    code: reverse ? `class Main {
  static String reverse(String input) {
    throw new UnsupportedOperationException("Implement reverse");
  }

  static void check(boolean passed) {
    if (!passed) throw new AssertionError("Reverse contract failed");
  }

  public static void main(String[] args) {
    check("cba".equals(reverse("abc")));
    check("".equals(reverse("")));
    check("B😀A".equals(reverse("A😀B")));
    try {
      reverse(null);
      throw new AssertionError("Null input was accepted");
    } catch (IllegalArgumentException expected) { }
    System.out.println("All four reverse checks passed");
  }
}
` : `// Exercise: ${title}
// Add your implementation, explicit assumptions, and boundary assertions.
// Framework and infrastructure exercises require their own local project.
class Main {
  public static void main(String[] args) throws Exception {
    throw new UnsupportedOperationException("Implement the selected exercise");
  }
}
`,
  };
}
