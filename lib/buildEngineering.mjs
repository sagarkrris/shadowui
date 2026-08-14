const MAVEN_DEPENDENCY = /<dependency>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>(?:[\s\S]*?<version>([^<]+)<\/version>)?[\s\S]*?<\/dependency>/g;
const GRADLE_DEPENDENCY = /(?:implementation|api|testImplementation|runtimeOnly)\s*[(']\s*['"]([^:'"]+):([^:'"]+)(?::([^'")]+))?/g;

export function analyzeBuildSnippet(source = "", tool = "maven") {
  const text = String(source || "").slice(0, 50_000);
  const matcher = tool === "gradle" ? GRADLE_DEPENDENCY : MAVEN_DEPENDENCY;
  const dependencies = [];
  for (const match of text.matchAll(matcher)) dependencies.push({ group: match[1].trim(), artifact: match[2].trim(), version: (match[3] || "managed").trim() });
  return { dependencies: dependencies.slice(0, 30), hasDynamicVersion: /(?:\+|latest\.|SNAPSHOT)/i.test(text), hasWrapper: tool === "gradle" ? /gradlew/.test(text) : /mvnw/.test(text) };
}

export const BUILD_SCENARIOS = [
  ["Dependency conflict", "A BOM upgrade changes a transitive Jackson version. Inspect the resolved graph, align versions, then add a regression test."],
  ["CI differs from local", "Compare JDK, wrapper, repository mirrors, cache keys, environment flags, and resolved dependency trees before changing code."],
  ["Stale build output", "Explain incremental build and cache inputs, invalidate only the affected cache, then prove a clean build reproduces the result."],
  ["Supply-chain response", "Pin versions, restrict repositories, inspect the dependency path, upgrade or constrain safely, and document verification."],
];

export const BUILD_TRANSLATIONS = [
  ["Maven dependencyManagement", "Gradle platform/BOM or version catalog"],
  ["Maven parent POM", "Gradle convention plugin"],
  ["mvn test", "./gradlew test"],
  ["mvn dependency:tree", "./gradlew dependencies"],
];
