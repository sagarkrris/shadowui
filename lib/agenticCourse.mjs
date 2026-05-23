export const PRODUCT_TAGLINE = "AI-powered interview intelligence for modern software engineers";

export const AGENTIC_UI_COURSE = {
  title: "Agentic UI Basics",
  kicker: "Mini Course",
  summary:
    "A beginner-friendly course on building screens where an AI agent can think, act, pause for approval, and explain what happened.",
  findings: [
    "Agentic UI is not just chat. It shows what the agent is doing and why.",
    "Users trust agents more when they can see the plan before the action.",
    "Risky steps need approval screens, not silent automation.",
    "A timeline, status labels, and guardrails make the agent feel understandable.",
  ],
  lessons: [
    {
      id: "agent-loop",
      title: "1. Show the Agent Loop",
      visual: "loop",
      description:
        "An agent usually repeats a loop: understand the goal, make a plan, use a tool, read the result, then decide the next step.",
      plainMeaning:
        "Do not hide the agent's thinking as a spinner. Show the current step so users know the system is working.",
      buildThis:
        "Create a timeline with labels like Understanding request, Planning, Using tool, Checking result, and Ready.",
      takeaways: [
        "Show the current step.",
        "Use simple labels, not model jargon.",
        "Let the user stop or redirect.",
      ],
    },
    {
      id: "autonomy-slider",
      title: "2. Calibrate Autonomy",
      visual: "autonomy",
      description:
        "Autonomy means how much the agent is allowed to do by itself. A safe UI lets users start small and increase control later.",
      plainMeaning:
        "New users usually want suggestions first. Advanced users may want the agent to draft or execute after review.",
      buildThis:
        "Add modes such as Suggest only, Draft for me, Ask before acting, and Auto-run safe steps.",
      takeaways: [
        "Start with low autonomy.",
        "Show the selected mode clearly.",
        "Allow easy downgrade to manual control.",
      ],
    },
    {
      id: "approval-gate",
      title: "3. Add Approval Gates",
      visual: "approval",
      description:
        "Some actions are too important to run silently. The UI should stop, preview the change, and ask the user to approve.",
      plainMeaning:
        "If the agent will send, delete, buy, publish, or change data, the user should see the exact action first.",
      buildThis:
        "Create an approval card with What will happen, Why, Edit, Cancel, and Approve buttons.",
      takeaways: [
        "Preview the exact change.",
        "Make cancel easy.",
        "Explain why approval is needed.",
      ],
    },
    {
      id: "trace-guardrails",
      title: "4. Build Trust Surfaces",
      visual: "trace",
      description:
        "Trust surfaces are the parts of the UI that explain what happened: timeline, logs, blocked actions, confidence, and guardrails.",
      plainMeaning:
        "When an agent fails, users should not see only Something went wrong. They need the reason and the next safe step.",
      buildThis:
        "Create a trace panel with steps, tool calls, blocked actions, errors, and a retry or ask-user action.",
      takeaways: [
        "Show a readable trace.",
        "Explain blocked actions.",
        "Give a clear recovery path.",
      ],
    },
  ],
  modules: [
    {
      id: "agent-loop-lab",
      title: "Module 1: Agent Loop Lab",
      outcome: "Understand the basic agent cycle and how to show it in the UI.",
      image: {
        title: "Agent Loop Map",
        caption: "A clear agentic interface shows the loop: goal, plan, tool action, result, and next decision.",
        visual: "loop",
      },
      video: {
        title: "Video: From Chat Box to Agent Loop",
        duration: "10:24",
        embedUrl: "https://www.youtube-nocookie.com/embed/MrD9tCNpOvU",
        watchUrl: "https://www.youtube.com/watch?v=MrD9tCNpOvU",
        chapters: ["Goal capture", "Visible plan", "Tool result", "Next step"],
      },
      practice: "Design a status timeline for an agent that researches a company and creates an interview plan.",
    },
    {
      id: "autonomy-levels",
      title: "Module 2: Autonomy Levels",
      outcome: "Learn how to decide what the agent may do alone and what needs user control.",
      image: {
        title: "Autonomy Ladder",
        caption: "Move from suggestions to drafts to approval-based execution before allowing safe auto-run behavior.",
        visual: "autonomy",
      },
      video: {
        title: "Video: Choosing the Right Autonomy Level",
        duration: "5:02",
        embedUrl: "https://www.youtube-nocookie.com/embed/wOs-5SR8xOc",
        watchUrl: "https://www.youtube.com/watch?v=wOs-5SR8xOc",
        chapters: ["Suggest", "Draft", "Ask before acting", "Auto-run safe steps"],
      },
      practice: "Create four autonomy modes for an interview-prep agent and decide which actions belong in each mode.",
    },
    {
      id: "approval-gates",
      title: "Module 3: Approval Gates",
      outcome: "Build safe pause points before the agent takes a risky or irreversible action.",
      image: {
        title: "Approval Gate Pattern",
        caption: "Risky actions should pause with a preview, reason, edit option, cancel option, and approval button.",
        visual: "approval",
      },
      video: {
        title: "Video: Designing Human-in-the-Loop Approval",
        duration: "8:18",
        embedUrl: "https://www.youtube-nocookie.com/embed/EH5jx5qPabU",
        watchUrl: "https://www.youtube.com/watch?v=EH5jx5qPabU",
        chapters: ["Risk detection", "Preview", "Approve/edit/cancel", "Resume"],
      },
      practice: "Sketch an approval card for an agent that is about to send a follow-up email after a mock interview.",
    },
    {
      id: "trace-guardrails",
      title: "Module 4: Traces and Guardrails",
      outcome: "Make the agent understandable when it succeeds, fails, or blocks an unsafe step.",
      image: {
        title: "Trace and Guardrail View",
        caption: "A trust surface should show steps, tool calls, blocked actions, errors, and recovery options.",
        visual: "trace",
      },
      video: {
        title: "Video: Trust Surfaces for Agentic Products",
        duration: "11:36",
        embedUrl: "https://www.youtube-nocookie.com/embed/wazHMMaiDEA",
        watchUrl: "https://www.youtube.com/watch?v=wazHMMaiDEA",
        chapters: ["Trace timeline", "Guardrail label", "Failure reason", "Recovery action"],
      },
      practice: "Create a trace panel for an agent that failed to analyze a screenshot and needs the user to retry safely.",
    },
  ],
};
