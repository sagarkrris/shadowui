export const PRODUCT_TAGLINE = "AI-powered interview intelligence for modern software engineers";

export const AGENTIC_UI_COURSE = {
  title: "Agentic UI Basics",
  kicker: "Mini Course",
  summary:
    "Learn how to design interfaces where an AI agent can plan, act, ask for approval, recover from mistakes, and keep the user in control.",
  findings: [
    "Make the agent loop visible: intent, plan, action, observation, and next step.",
    "Increase autonomy gradually instead of giving the agent full control on the first screen.",
    "Gate risky actions with human approval and show exactly what will change.",
    "Expose traces, status, and guardrails so users can trust the system under pressure.",
  ],
  lessons: [
    {
      id: "agent-loop",
      title: "1. Show the Agent Loop",
      visual: "loop",
      description:
        "A strong agentic UI tells the user what the agent understood, what it plans to do, which tool it is using, and what it learned after each step.",
      takeaways: [
        "Show intent before action.",
        "Display live progress in plain language.",
        "Let users interrupt or redirect the loop.",
      ],
    },
    {
      id: "autonomy-slider",
      title: "2. Calibrate Autonomy",
      visual: "autonomy",
      description:
        "Agentic products feel safer when users can choose how much the system may do alone, from suggestions to drafted actions to approved execution.",
      takeaways: [
        "Start with assistive mode for new users.",
        "Unlock higher autonomy after confidence grows.",
        "Keep the current autonomy level visible.",
      ],
    },
    {
      id: "approval-gate",
      title: "3. Add Approval Gates",
      visual: "approval",
      description:
        "Before the agent spends money, changes data, sends messages, or takes irreversible actions, the UI should pause and request human approval.",
      takeaways: [
        "Preview the exact change before execution.",
        "Separate low-risk and high-risk actions.",
        "Make approve, edit, and cancel equally clear.",
      ],
    },
    {
      id: "trace-guardrails",
      title: "4. Build Trust Surfaces",
      visual: "trace",
      description:
        "Users trust agents faster when they can inspect the timeline, understand why something happened, and see guardrails around sensitive tasks.",
      takeaways: [
        "Keep a readable action timeline.",
        "Explain blocked or downgraded actions.",
        "Never hide failures behind vague messages.",
      ],
    },
  ],
};
