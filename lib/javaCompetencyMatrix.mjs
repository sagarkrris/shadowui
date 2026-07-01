export const JAVA_COMPETENCY_LEVELS = ["Junior", "Mid", "Senior", "Staff"];

const JAVA_RELEASES = Array.from({ length: 26 }, (_, index) => {
  const version = index + 1;
  return {
    version,
    label: `Java ${version}`,
    lts: [8, 11, 17, 21, 25].includes(version),
    status: version === 26 ? "current" : "released",
  };
});

const LEVEL_COMPETENCIES = {
  Junior: [
    "Core Java and Collections",
    "Exceptions, Generics, and Streams",
    "Unit Testing with JUnit and Mockito",
    "Spring Boot Fundamentals",
    "SQL and REST API Fundamentals",
  ],
  Mid: [
    "JVM and Garbage Collection",
    "JPA Performance",
    "Spring Security and OAuth2",
    "Testing with JUnit, Mockito, and Testcontainers",
    "Redis",
    "Docker and Kubernetes",
  ],
  Senior: [
    "Virtual Threads",
    "Kafka",
    "Observability",
    "Distributed Systems Reliability",
    "Cloud-Native Java Architecture",
  ],
  Staff: [
    "Cloud Architecture",
    "Platform and Developer Experience",
    "Cross-Team Technical Strategy",
    "Cost, Capacity, and Resilience Governance",
  ],
};

function competency(name) {
  return { name, status: "not-started" };
}

export function buildJavaCompetencyMatrix() {
  return {
    latestRelease: JAVA_RELEASES.at(-1),
    releases: JAVA_RELEASES.map((release) => ({ ...release })),
    levels: JAVA_COMPETENCY_LEVELS.map((name) => ({
      name,
      competencies: LEVEL_COMPETENCIES[name].map(competency),
    })),
  };
}
