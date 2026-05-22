export const CHIPS = ["React state patterns", "REST API design", "SQL indexing", "System design basics", "JavaScript closures", "Spring Security JWT", "Docker deployment", "DP: Coin Change"];

export const TOPIC_CHIPS = {
  Frontend: ["React interview questions", "JavaScript fundamentals", "Frontend performance review", "Accessibility scenarios", "Next.js routing practice"],
  Backend: ["REST API design review", "Authentication interview questions", "Spring Boot scenarios", "Node.js API practice", "Microservice trade-offs"],
  Databases: ["SQL query tuning questions", "Database schema design", "Transactions interview", "NoSQL trade-offs", "Indexing practice"],
  "Cloud & DevOps": ["Docker interview questions", "CI/CD pipeline design", "Cloud deployment scenarios", "Observability practice", "Message queue trade-offs"],
  DSA: ["Array and string drills", "Tree and graph questions", "Dynamic programming practice", "Heap interview problems", "Explain Dijkstra's algorithm"],
  "System Design": ["URL shortener design", "Caching strategy interview", "Message queue trade-offs", "Database schema design", "Scalability deep dive"],
  Behavioral: ["Ownership STAR questions", "Collaboration scenarios", "Conflict resolution practice", "Mentoring story review", "Delivery pressure scenario"],
};

export const DIFFS = ["Entry", "Mid", "Senior", "Lead"];

export const DEFAULT_PROFILE = {
  name: "",
  position: "",
  experience: "",
  stack: "",
};

export function getQuickPrompts(selectedCat, selectedSub) {
  if (!selectedCat) return CHIPS;
  if (selectedSub) {
    if (selectedCat === "Behavioral") {
      return [
        `Ask STAR questions about ${selectedSub}`,
        `Give a strong ${selectedSub} answer`,
        `Evaluate my ${selectedSub} story`,
        `Follow-up questions for ${selectedSub}`,
      ];
    }
    if (selectedCat === "System Design") {
      return [
        `Ask HLD questions on ${selectedSub}`,
        `Design a system using ${selectedSub}`,
        `Trade-offs in ${selectedSub}`,
        `Common mistakes in ${selectedSub}`,
      ];
    }
    return [
      `Ask interview questions on ${selectedSub}`,
      `Explain ${selectedSub} deeply`,
      `Give practical examples for ${selectedSub}`,
      `Common mistakes in ${selectedSub}`,
    ];
  }
  return TOPIC_CHIPS[selectedCat] || [
    `${selectedCat} interview questions`,
    `Explain ${selectedCat} clearly`,
    `${selectedCat} practical scenarios`,
    `${selectedCat} common mistakes`,
    `${selectedCat} mock round`,
  ];
}
