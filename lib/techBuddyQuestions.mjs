// Local practice questions from the supplied Tech Buddy prototype. No AI scoring.
export const TECH_BUDDY_QUESTIONS = {
  "fresher": [
    {
      "id": "fresher-1",
      "category": "Core Java",
      "question": "What is the difference between JDK, JRE and JVM?"
    },
    {
      "id": "fresher-2",
      "category": "OOP",
      "question": "Explain the four pillars of Object-Oriented Programming with a Java example."
    },
    {
      "id": "fresher-3",
      "category": "Core Java",
      "question": "What is the difference between == and .equals() in Java?"
    },
    {
      "id": "fresher-4",
      "category": "Core Java",
      "question": "What are the main differences between an array and an ArrayList?"
    },
    {
      "id": "fresher-5",
      "category": "OOP",
      "question": "What is method overloading vs method overriding?"
    },
    {
      "id": "fresher-6",
      "category": "Core Java",
      "question": "Why is Java called platform independent?"
    }
  ],
  "junior": [
    {
      "id": "junior-1",
      "category": "Collections",
      "question": "When would you use a HashMap vs a TreeMap vs a LinkedHashMap?"
    },
    {
      "id": "junior-2",
      "category": "Exceptions",
      "question": "What is the difference between checked and unchecked exceptions in Java?"
    },
    {
      "id": "junior-3",
      "category": "Core Java",
      "question": "Explain how String immutability works and why Strings are cached in a pool."
    },
    {
      "id": "junior-4",
      "category": "OOP",
      "question": "What is the difference between an abstract class and an interface?"
    },
    {
      "id": "junior-5",
      "category": "Collections",
      "question": "How does a HashMap handle collisions internally?"
    },
    {
      "id": "junior-6",
      "category": "Core Java",
      "question": "What does the \"static\" keyword mean, and where have you used it?"
    }
  ],
  "mid": [
    {
      "id": "mid-1",
      "category": "Multithreading",
      "question": "Explain the difference between synchronized methods and using a Lock/ReentrantLock."
    },
    {
      "id": "mid-2",
      "category": "Spring",
      "question": "What is dependency injection, and how does Spring implement it?"
    },
    {
      "id": "mid-3",
      "category": "JVM",
      "question": "Walk through what happens during Java garbage collection at a high level."
    },
    {
      "id": "mid-4",
      "category": "Collections",
      "question": "What is the difference between fail-fast and fail-safe iterators?"
    },
    {
      "id": "mid-5",
      "category": "Multithreading",
      "question": "What is the difference between Runnable and Callable?"
    },
    {
      "id": "mid-6",
      "category": "Spring",
      "question": "Explain the Spring Bean lifecycle and common scopes."
    }
  ],
  "senior": [
    {
      "id": "senior-1",
      "category": "System Design",
      "question": "How would you design a rate limiter for a high-traffic Java-based API?"
    },
    {
      "id": "senior-2",
      "category": "Concurrency",
      "question": "Explain the Java Memory Model and what \"happens-before\" means."
    },
    {
      "id": "senior-3",
      "category": "Microservices",
      "question": "How do you handle distributed transactions across microservices in Java (e.g. saga pattern)?"
    },
    {
      "id": "senior-4",
      "category": "Performance",
      "question": "How would you diagnose and fix a memory leak in a production Java application?"
    },
    {
      "id": "senior-5",
      "category": "System Design",
      "question": "Design a caching layer for a Spring Boot service \u2014 what would you consider?"
    },
    {
      "id": "senior-6",
      "category": "Concurrency",
      "question": "Compare ExecutorService thread pools: fixed, cached, and work-stealing (ForkJoinPool)."
    }
  ],
  "lead": [
    {
      "id": "lead-1",
      "category": "Architecture",
      "question": "How do you decide between a monolith and microservices for a new platform?"
    },
    {
      "id": "lead-2",
      "category": "Architecture",
      "question": "How would you lead a legacy Java monolith migration to a modern stack with zero downtime?"
    },
    {
      "id": "lead-3",
      "category": "Trade-offs",
      "question": "Walk me through a major technical trade-off you made and how you justified it to stakeholders."
    },
    {
      "id": "lead-4",
      "category": "Mentorship",
      "question": "How do you mentor junior engineers while still delivering on your own technical commitments?"
    },
    {
      "id": "lead-5",
      "category": "Architecture",
      "question": "How would you approach setting coding and design standards across multiple Java teams?"
    },
    {
      "id": "lead-6",
      "category": "Reliability",
      "question": "How do you design for graceful degradation and fault tolerance in a distributed Java system?"
    }
  ],
  "manager": [
    {
      "id": "manager-1",
      "category": "Leadership",
      "question": "Tell me about a time you had to deliver a project despite significant technical or resourcing setbacks."
    },
    {
      "id": "manager-2",
      "category": "People",
      "question": "How do you handle a high-performing engineer who is difficult to work with on a team?"
    },
    {
      "id": "manager-3",
      "category": "Strategy",
      "question": "How do you balance technical debt against feature delivery when prioritizing a roadmap?"
    },
    {
      "id": "manager-4",
      "category": "People",
      "question": "Tell me about a time you had to give a direct report difficult feedback on their performance."
    },
    {
      "id": "manager-5",
      "category": "Strategy",
      "question": "How do you evaluate whether to build, buy, or adopt open source for a new capability?"
    },
    {
      "id": "manager-6",
      "category": "Leadership",
      "question": "How do you keep a team of senior engineers aligned when they disagree on technical direction?"
    }
  ]
};
