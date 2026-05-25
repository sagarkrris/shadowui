import { getTechTheme } from "./techTheme.mjs";

export const BASE_TOPICS = [
  { cat: "Frontend", icon: "ti-brand-react", color: "#38bdf8", subs: ["HTML & CSS", "JavaScript / TypeScript", "React & Next.js", "State Management", "Accessibility", "Performance", "Testing UI", "Frontend Architecture"] },
  { cat: "Backend", icon: "ti-server", color: "#22c55e", subs: ["API Design", "Java / Spring Boot", "Node.js / Express", "Authentication & Security", "ORM / JPA", "Microservices", "Caching", "Testing APIs"] },
  { cat: "Databases", icon: "ti-database", color: "#f59e0b", subs: ["SQL Design", "Indexing & Query Tuning", "Transactions", "NoSQL Databases", "Data Modeling", "Migrations", "Replication", "Caching Strategies"] },
  { cat: "Cloud & DevOps", icon: "ti-cloud", color: "#60a5fa", subs: ["Docker", "Kubernetes", "CI/CD", "AWS / Azure / GCP", "Observability", "Deployment Strategies", "API Gateway", "Message Queues"] },
  { cat: "DSA", icon: "ti-binary-tree", color: "#a78bfa", subs: ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Sorting & Searching", "Stacks & Queues", "Heaps & Priority Queues", "Tries & Segment Trees"] },
  { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["HLD Patterns", "Database Design", "Caching Strategies", "Message Queues", "Scalability & Load", "API Design", "Real-world Systems"] },
  { cat: "Behavioral", icon: "ti-users", color: "#34d399", subs: ["Ownership", "Collaboration", "Conflict Resolution", "Mentoring", "Delivery Under Pressure", "STAR Method Practice"] },
];

const STACK_TOPICS = {
  python: [
    { cat: "Python Core", icon: "ti-brand-python", color: "#3776ab", subs: ["Data Structures", "OOP & Dataclasses", "Decorators", "Generators", "Async IO", "Typing", "Memory & Performance"] },
    { cat: "Django & FastAPI", icon: "ti-api", color: "#22c55e", subs: ["Django ORM", "FastAPI Routing", "Pydantic", "Auth & Permissions", "Background Jobs", "API Versioning"] },
    { cat: "Testing Python", icon: "ti-test-pipe", color: "#f59e0b", subs: ["Pytest", "Fixtures", "Mocking", "Integration Tests", "Coverage", "Test Data"] },
    { cat: "Data & Storage", icon: "ti-database", color: "#60a5fa", subs: ["PostgreSQL", "SQLAlchemy", "Migrations", "Redis", "Query Tuning", "Transactions"] },
    { cat: "Algorithms", icon: "ti-binary-tree", color: "#a78bfa", subs: ["DSA in Python", "Lists & Dicts", "Heaps", "Graphs", "Dynamic Programming", "Complexity"] },
    { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["API Design", "Caching", "Queues", "Workers", "Observability", "Scaling Python Services"] },
    { cat: "Behavioral", icon: "ti-users", color: "#34d399", subs: ["Ownership", "Debugging Stories", "Collaboration", "Mentoring", "Delivery Under Pressure"] },
  ],
  java: [
    { cat: "Java Core", icon: "ti-brand-java", color: "#f89820", subs: ["Collections", "Streams", "Concurrency", "JVM Memory", "Exceptions", "Generics", "Design Patterns"] },
    { cat: "Spring Boot", icon: "ti-leaf", color: "#22c55e", subs: ["REST Controllers", "Spring Security", "JPA & Hibernate", "Validation", "Profiles", "Actuator", "Testing APIs"] },
    { cat: "Data & Messaging", icon: "ti-database", color: "#60a5fa", subs: ["SQL Design", "Transactions", "JPA Queries", "Redis", "Kafka", "Migrations"] },
    { cat: "Testing Java", icon: "ti-test-pipe", color: "#f59e0b", subs: ["JUnit", "Mockito", "SpringBootTest", "Testcontainers", "Contract Tests", "Coverage"] },
    { cat: "Algorithms", icon: "ti-binary-tree", color: "#a78bfa", subs: ["DSA in Java", "Collections Tricks", "Trees & Graphs", "Dynamic Programming", "Complexity"] },
    { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["Microservices", "Caching", "Message Queues", "API Gateway", "Scalability", "Observability"] },
    { cat: "Behavioral", icon: "ti-users", color: "#34d399", subs: ["Ownership", "Production Incidents", "Collaboration", "Mentoring", "Delivery Under Pressure"] },
  ],
  sql: [
    { cat: "SQL & Relational Databases", icon: "ti-database", color: "#f59e0b", subs: ["Joins & Aggregations", "Indexing & Query Plans", "Transactions", "Normalization", "Window Functions", "Stored Procedures", "Query Tuning"] },
    { cat: "Data Modeling", icon: "ti-schema", color: "#60a5fa", subs: ["ER Design", "Constraints", "Migrations", "Audit Fields", "Partitioning", "Reporting Tables"] },
    { cat: "Database Reliability", icon: "ti-shield-check", color: "#22c55e", subs: ["Backups", "Replication", "Locking", "Deadlocks", "Isolation Levels", "Zero-downtime Changes"] },
    { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["Read-heavy Systems", "Caching", "Search", "Sharding", "Data Consistency", "Observability"] },
    { cat: "Behavioral", icon: "ti-users", color: "#34d399", subs: ["Debugging Stories", "Ownership", "Production Incidents", "Collaboration", "Delivery Under Pressure"] },
  ],
  sap: [
    { cat: "SAP Core", icon: "ti-building", color: "#0f9ed5", subs: ["ABAP", "S/4HANA", "Fiori", "OData Services", "CDS Views", "BAPIs", "IDocs"] },
    { cat: "SAP Integration", icon: "ti-api", color: "#22c55e", subs: ["RFC", "PI/PO", "CPI", "API Management", "Event Mesh", "External Services"] },
    { cat: "SAP Data & Security", icon: "ti-database", color: "#f59e0b", subs: ["HANA Basics", "Authorizations", "Roles", "Performance Traces", "Transport Management"] },
    { cat: "Enterprise Scenarios", icon: "ti-topology-star", color: "#f472b6", subs: ["Order-to-Cash", "Procure-to-Pay", "Master Data", "Workflow", "Migration Strategy"] },
    { cat: "Behavioral", icon: "ti-users", color: "#34d399", subs: ["Stakeholder Alignment", "Production Support", "Ownership", "Cross-team Delivery"] },
  ],
  ruby: [
    { cat: "Ruby Core", icon: "ti-diamond", color: "#cc342d", subs: ["Objects & Modules", "Blocks & Procs", "Enumerables", "Metaprogramming", "Error Handling", "Memory & Performance"] },
    { cat: "Rails", icon: "ti-route", color: "#22c55e", subs: ["Rails MVC", "ActiveRecord", "Routing", "Validations", "Background Jobs", "Security", "Caching"] },
    { cat: "Testing Ruby", icon: "ti-test-pipe", color: "#f59e0b", subs: ["RSpec", "Factories", "Request Specs", "Model Specs", "System Specs", "Mocking"] },
    { cat: "Data & APIs", icon: "ti-database", color: "#60a5fa", subs: ["SQL", "Migrations", "N+1 Queries", "REST APIs", "Auth", "Sidekiq"] },
    { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["Monoliths", "Service Extraction", "Queues", "Caching", "Observability", "Scaling Rails"] },
  ],
  rust: [
    { cat: "Rust Core", icon: "ti-brand-rust", color: "#ce422b", subs: ["Ownership & Borrowing", "Lifetimes", "Traits", "Enums & Pattern Matching", "Error Handling", "Cargo", "Async Rust"] },
    { cat: "Async Rust", icon: "ti-bolt", color: "#22c55e", subs: ["Tokio", "Futures", "Channels", "Actix", "Axum", "Backpressure"] },
    { cat: "Systems & Performance", icon: "ti-cpu", color: "#f59e0b", subs: ["Memory Safety", "Concurrency", "Profiling", "Zero-cost Abstractions", "FFI", "Serialization"] },
    { cat: "Testing Rust", icon: "ti-test-pipe", color: "#60a5fa", subs: ["Unit Tests", "Integration Tests", "Property Testing", "Benchmarks", "Test Fixtures"] },
    { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["High-throughput APIs", "Workers", "Queues", "Observability", "Failure Modes"] },
  ],
  react: [
    { cat: "React Core", icon: "ti-brand-react", color: "#61dafb", subs: ["Hooks", "Component Design", "State Management", "Forms", "Rendering", "Performance"] },
    { cat: "Next.js", icon: "ti-route", color: "#e5e7eb", subs: ["Routing", "Server Components", "API Routes", "Data Fetching", "Auth", "Deployment"] },
    { cat: "UI Engineering", icon: "ti-layout", color: "#f59e0b", subs: ["Accessibility", "Responsive Layouts", "Design Systems", "Testing UI", "Browser APIs"] },
    { cat: "Frontend System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["Component Architecture", "Caching", "Realtime UI", "Performance Budgets", "Monitoring"] },
    { cat: "Behavioral", icon: "ti-users", color: "#34d399", subs: ["Ownership", "Product Thinking", "Collaboration", "Mentoring", "Delivery Under Pressure"] },
  ],
  node: [
    { cat: "Node.js Core", icon: "ti-brand-nodejs", color: "#68a063", subs: ["Event Loop", "Streams", "Async Patterns", "Error Handling", "Packages", "Performance"] },
    { cat: "APIs", icon: "ti-api", color: "#22c55e", subs: ["Express", "NestJS", "REST", "Validation", "Authentication", "Rate Limiting"] },
    { cat: "Data & Queues", icon: "ti-database", color: "#60a5fa", subs: ["PostgreSQL", "MongoDB", "Redis", "Migrations", "Message Queues", "Caching"] },
    { cat: "Testing Node", icon: "ti-test-pipe", color: "#f59e0b", subs: ["Unit Tests", "Integration Tests", "Mocking", "Contract Tests", "Coverage"] },
    { cat: "System Design", icon: "ti-topology-star", color: "#f472b6", subs: ["Scalability", "Workers", "Queues", "Observability", "Deployment"] },
  ],
};

export function getPrepLabel(stack) {
  const theme = getTechTheme(stack);
  return theme.key === "default" ? "Full Stack Prep" : `${theme.label} Prep`;
}

export function getRecommendedTopics(profile) {
  if (!profile) return BASE_TOPICS;

  const theme = getTechTheme(profile.stack);
  if (STACK_TOPICS[theme.key]) return STACK_TOPICS[theme.key];

  const haystack = `${profile.position || ""} ${profile.stack || ""}`.toLowerCase();
  const selected = new Set();

  const add = (cat) => selected.add(cat);
  if (/full\s*stack|mern|mean|frontend.*backend|backend.*frontend/.test(haystack)) {
    ["Frontend", "Backend", "Databases", "Cloud & DevOps"].forEach(add);
  }
  if (/front|react|next|angular|vue|javascript|typescript|html|css|ui|web/.test(haystack)) add("Frontend");
  if (/back|api|java|spring|node|express|python|django|go|microservice|auth|ruby|rails|rust|sap|abap|odata/.test(haystack)) add("Backend");
  if (/sql|postgres|mysql|mongo|database|db|redis|oracle|nosql/.test(haystack)) add("Databases");
  if (/cloud|aws|azure|gcp|docker|kubernetes|devops|ci\/cd|cicd|jenkins|terraform|oci/.test(haystack)) add("Cloud & DevOps");

  ["DSA", "System Design", "Behavioral"].forEach(add);

  const recommended = BASE_TOPICS.filter((topic) => selected.has(topic.cat));
  return recommended.length ? recommended : BASE_TOPICS;
}
