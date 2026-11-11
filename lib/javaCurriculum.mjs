import { JAVA_RELEASE_SEEDS, JAVA_RELEASE_CHAPTERS } from './javaReleaseLessons.mjs';
// Titles are stable route identities; catalog IDs remain independent of lesson order.
export const JAVA_CURRICULUM_GROUPS = [
  ['Core Java', 'Install a JDK, run a program, and learn values, decisions and methods.', ['JDK vs JRE vs JVM', 'Variables and assignment', 'Primitive types', 'Operators', 'Casting and promotion', 'Control flow', 'Methods and parameters', 'Arrays']],
  ['Objects and contracts', 'Understand objects before using library and framework abstractions.', ['Classes and objects', 'Null and references', 'Packages and imports', 'Access modifiers', 'Constructors', 'Inheritance', 'Composition', 'Abstract classes', 'Interfaces', 'Polymorphism', 'Enums', 'String immutability', 'StringBuilder', 'Wrapper classes', 'equals and hashCode', 'Generics', 'Wildcards and PECS', 'Type erasure', 'Comparable and Comparator']],
  ['Collections and language tools', 'Choose containers, handle failure and transform values.', ['ArrayList', 'LinkedList', 'HashSet', 'TreeSet', 'HashMap', 'TreeMap', 'PriorityQueue', 'ArrayDeque', 'Checked exceptions', 'Unchecked exceptions', 'try-with-resources', 'Custom exceptions', 'Functional interfaces', 'Lambda expressions', 'Stream pipelines', 'Collectors', 'Optional', 'Regular expressions', 'Date and time API', 'Files and Paths', 'Serialization boundaries', 'Records', 'Sealed classes', 'Modules']],
  ['Testing and problem solving', 'Verify behavior before introducing services and shared state.', ['Build tools and dependencies', 'Assertions', 'JUnit test design', 'Mocks and stubs', 'Property-based testing', 'Big-O reasoning', 'Two pointers', 'Sliding window', 'Binary search', 'Recursion', 'Dynamic programming', 'Graph traversal', 'Topological sorting', 'Union-find', 'Range queries']],
  ['JVM and concurrency', 'Learn memory ownership, then coordinate bounded concurrent work.', ['Class loading', 'Heap and stack', 'Garbage collection', 'Java Memory Management', 'JIT compilation', 'Memory leaks', 'JFR diagnostics', 'Threads', 'synchronized and locks', 'Atomics and CAS', 'Executors', 'CompletableFuture', 'Virtual threads']],
  ['Data and HTTP foundations', 'Understand database and network contracts before Spring integration.', ['SQL foundations', 'JDBC basics', 'PreparedStatement', 'Transactions', 'Indexes and query plans', 'HTTP foundations', 'REST resource design', 'Testcontainers']],
  ['Design and Spring services', 'Apply object design, then connect managed services and persistence.', ['SOLID principles', 'Dependency inversion', 'Builder pattern', 'Factory pattern', 'Strategy pattern', 'Observer pattern', 'Decorator pattern', 'Spring IoC', 'Spring beans', 'Spring profiles', 'Spring Boot configuration', 'Spring MVC', 'Spring validation', 'Spring Security', 'Spring Data JPA', 'Testing Spring applications', 'Actuator and observability']],
  ['Reliable systems', 'Reason about ambiguous outcomes, capacity, recovery and delivery.', ['Idempotency', 'Timeouts and retries', 'Circuit breakers', 'Resilience patterns', 'Event-driven design']],
  ['Modern Java by release', 'Core permanent features first; use the LTS checkpoints on the release path for Java 17, 21 and 25.', JAVA_RELEASE_SEEDS.filter(([title]) => JAVA_RELEASE_CHAPTERS[title].status === 'permanent').map(([title]) => title)],
  ['Optional: what is coming', 'Preview and incubator labs are optional exploration, not a prerequisite for interview preparation. They require their exact declared JDK and flags.', JAVA_RELEASE_SEEDS.filter(([title]) => JAVA_RELEASE_CHAPTERS[title].status !== 'permanent').map(([title]) => title)],
];

export function orderJavaTutorials(catalog) {
  const byTitle = new Map(catalog.map(lesson => [lesson.title, lesson]));
  const titles = JAVA_CURRICULUM_GROUPS.flatMap(([, , lessons]) => lessons);
  if (new Set(titles).size !== titles.length || titles.length !== catalog.length || titles.some(title => !byTitle.has(title))) throw new Error('Java curriculum must include every chapter exactly once');
  return titles.map((title, index) => ({ ...byTitle.get(title), chapterNumber: index + 1 }));
}

export function getJavaCurriculumGroups(catalog) {
  const ordered = orderJavaTutorials(catalog);
  return JAVA_CURRICULUM_GROUPS.map(([title, description, titles]) => ({ title, description, steps: ordered.filter(lesson => titles.includes(lesson.title)) }));
}

export function getJavaChapterNavigation(catalog, id) {
  const ordered = orderJavaTutorials(catalog);
  const index = ordered.findIndex(lesson => lesson.id === id);
  return { previous: ordered[index - 1] || null, next: index < 0 ? null : ordered[index + 1] || null };
}
