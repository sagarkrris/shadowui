export const PRODUCT_TAGLINE = "AI-powered interview intelligence for modern software engineers";

export const AGENTIC_UI_COURSE = {
  title: "Agentic UI Engineering Course",
  kicker: "Stack-Aware Course",
  summary:
    "A hands-on course for building agentic products with a visible agent loop, Java/Spring Boot backends, React/Next.js interfaces, approval gates, traces, and production guardrails.",
  findings: [
    "Agentic UI is not just chat. It shows what the agent is doing, which tools it used, and what it needs from the user.",
    "Java/Spring Boot is a strong default for agent APIs because approval, audit, security, and workflow state fit naturally into backend services.",
    "React/Next.js should own the trust surface: streaming steps, timeline, tool cards, retry actions, and human approval screens.",
    "Other stacks should reuse the same product contract: goal, plan, tool call, observation, approval, trace, and recovery.",
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
    {
      id: "tool-calling-contracts",
      title: "Module 5: Tool Calling Contracts",
      outcome: "Define backend tool contracts that the UI can explain before and after execution.",
      image: {
        title: "Tool Contract Map",
        caption: "Each tool needs a user-readable name, input preview, risk level, result summary, and recovery path.",
        visual: "trace",
      },
      video: {
        title: "Video: Tool Calls Users Can Trust",
        duration: "9:40",
        embedUrl: "https://www.youtube-nocookie.com/embed/MrD9tCNpOvU",
        watchUrl: "https://www.youtube.com/watch?v=MrD9tCNpOvU",
        chapters: ["Tool schema", "Risk label", "Result card", "Retry path"],
      },
      practice: "Write a tool card contract for resume analysis, JD matching, interview scheduling, and proof story extraction.",
    },
    {
      id: "streaming-state",
      title: "Module 6: Streaming State and Recovery",
      outcome: "Render live progress, partial answers, errors, and resume-safe recovery states.",
      image: {
        title: "Streaming Recovery Path",
        caption: "A useful agent screen keeps the user oriented during streaming, cancellation, fallback, and retry.",
        visual: "loop",
      },
      video: {
        title: "Video: Streaming Agent State in the UI",
        duration: "12:08",
        embedUrl: "https://www.youtube-nocookie.com/embed/wOs-5SR8xOc",
        watchUrl: "https://www.youtube.com/watch?v=wOs-5SR8xOc",
        chapters: ["Streaming step", "Partial answer", "Cancel", "Retry from trace"],
      },
      practice: "Build a response area that shows Thinking, Calling tool, Reviewing result, Needs approval, Done, and Retry.",
    },
  ],
  stackTracks: [
    {
      id: "java-spring",
      title: "Java / Spring Boot",
      level: "Primary build track",
      bestFor: "Backend engineers who want to build production agent APIs with Spring Boot, Spring AI style ChatClient flows, validation, audit logs, and approval gates.",
      outcome: "Ship a Spring Boot agent service that powers a visible InterviewIQ prep agent.",
      labs: [
        {
          title: "Lab 1: Create the Agent API Shell",
          deliverable: "A Spring Boot controller that accepts a goal and returns an agent run id.",
          steps: [
            "Create AgentRunRequest and AgentRunResponse DTOs.",
            "Add an AgentRunService that creates the run state.",
            "Return the first visible step: Goal received.",
          ],
          codeSnippet: `@RestController
@RequestMapping("/api/agent-runs")
class AgentRunController {
  private final AgentRunService service;

  AgentRunController(AgentRunService service) {
    this.service = service;
  }

  @PostMapping
  AgentRunResponse start(@RequestBody AgentRunRequest request) {
    return service.start(request.goal(), request.profile());
  }
}`,
        },
        {
          title: "Lab 2: Add Spring AI ChatClient Planning",
          deliverable: "A planning step that turns a user goal into 3 to 5 visible actions.",
          steps: [
            "Create a system prompt that asks for a JSON-safe plan.",
            "Call ChatClient from the service layer, not the controller.",
            "Store the plan as trace steps before any tool executes.",
          ],
          codeSnippet: `String plan = chatClient.prompt()
  .system("Plan an interview prep agent run. Return concise steps.")
  .user(request.goal())
  .call()
  .content();`,
        },
        {
          title: "Lab 3: Register Safe Tools",
          deliverable: "Tool definitions for resume gap analysis, JD matching, and practice plan creation.",
          steps: [
            "Name every tool with user-facing language.",
            "Attach a risk level: safe, review, or approval required.",
            "Return a short result summary for the UI card.",
          ],
          codeSnippet: `record AgentToolResult(
  String toolName,
  String riskLevel,
  String summary,
  Map<String, Object> data
) {}`,
        },
        {
          title: "Lab 4: Build the Approval Gate",
          deliverable: "A pause state before scheduling, sending, saving, or publishing.",
          steps: [
            "Create an ApprovalRequest with action, reason, preview, and editable payload.",
            "Expose approve and cancel endpoints.",
            "Resume the agent only after approval is recorded.",
          ],
          codeSnippet: `@PostMapping("/{runId}/approval")
AgentRunResponse approve(@PathVariable String runId, @RequestBody ApprovalDecision decision) {
  return service.resolveApproval(runId, decision.approved(), decision.editedPayload());
}`,
        },
        {
          title: "Lab 5: Persist Trace and Recovery",
          deliverable: "A readable trace timeline with failed step, retry action, and audit metadata.",
          steps: [
            "Persist each step with status, timestamp, tool name, and error message.",
            "Redact secrets before storing trace details.",
            "Let the UI retry from the last safe checkpoint.",
          ],
          codeSnippet: `record AgentTraceStep(
  String label,
  String status,
  String toolName,
  String safeSummary,
  Instant createdAt
) {}`,
        },
      ],
    },
    {
      id: "react-next",
      title: "React / Next.js",
      level: "Frontend trust track",
      bestFor: "Frontend and full-stack engineers who want to build agent timelines, streaming response panels, tool cards, and approval screens.",
      outcome: "Build the visible agent cockpit that explains progress and asks for approval.",
      labs: [
        {
          title: "Lab 1: Agent Timeline Component",
          deliverable: "A compact timeline for intent, plan, tool, observe, and done.",
          steps: ["Render stable step rows.", "Show status badges.", "Keep the active step visible on mobile."],
          codeSnippet: `const steps = ["Intent", "Plan", "Tool", "Observe", "Done"];`,
        },
        {
          title: "Lab 2: Streaming Answer Panel",
          deliverable: "A response panel that separates plan, partial answer, result cards, and final answer.",
          steps: ["Append streamed text safely.", "Keep tool output in cards.", "Show retry on stream failure."],
          codeSnippet: `setMessages((items) => [...items, { role: "assistant", content: chunk.text }]);`,
        },
        {
          title: "Lab 3: Approval Card",
          deliverable: "A modal/card with preview, edit, approve, and cancel actions.",
          steps: ["Show exact action.", "Explain risk.", "Keep cancel visually available."],
          codeSnippet: `<button aria-label="Approve agent action">Approve</button>`,
        },
      ],
    },
    {
      id: "node-python",
      title: "Node.js / Python",
      level: "Service adapter track",
      bestFor: "Teams using Express, FastAPI, or lightweight services to expose agent tools and stream state to a frontend.",
      outcome: "Map the same agent contract to JavaScript or Python services.",
      labs: [
        {
          title: "Lab 1: Tool Endpoint Adapter",
          deliverable: "A POST endpoint that runs one safe tool and returns a result card payload.",
          steps: ["Validate input.", "Run one tool.", "Return summary plus structured data."],
          codeSnippet: `app.post("/api/tools/resume-gap", async (req, res) => res.json(await runResumeGap(req.body)));`,
        },
        {
          title: "Lab 2: Event Stream",
          deliverable: "A stream of agent step events for the UI timeline.",
          steps: ["Emit planning.", "Emit tool_started.", "Emit tool_done or blocked."],
          codeSnippet: `yield { type: "tool_started", label: "Analyzing resume" };`,
        },
        {
          title: "Lab 3: Guardrail Middleware",
          deliverable: "A policy check before risky operations.",
          steps: ["Classify action risk.", "Block unsafe payloads.", "Return approval_required when needed."],
          codeSnippet: `if (risk === "approval_required") return { status: "blocked", approvalRequired: true };`,
        },
      ],
    },
    {
      id: "ruby-rust-sap",
      title: "Ruby / Rust / SAP Adapter",
      level: "Enterprise integration track",
      bestFor: "Engineers who need to connect agentic UI patterns to Rails apps, Rust services, SAP workflows, or enterprise approval systems.",
      outcome: "Reuse the same UI contract around existing enterprise services without rewriting the product.",
      labs: [
        {
          title: "Lab 1: Contract First Integration",
          deliverable: "A shared JSON contract for action preview, approval, result, and audit state.",
          steps: ["Define the contract.", "Map local service fields.", "Reject unknown action types."],
          codeSnippet: `{"action":"schedule_interview","risk":"approval_required","preview":{}}`,
        },
        {
          title: "Lab 2: Enterprise Approval Mapping",
          deliverable: "A UI approval state that can hand off to SAP, workflow tools, or internal ticketing.",
          steps: ["Show external owner.", "Show approval status.", "Resume after approved callback."],
          codeSnippet: `approvalStatus: "waiting_for_enterprise_workflow"`,
        },
        {
          title: "Lab 3: Audit and Compliance Surface",
          deliverable: "A trace view that can be exported for review without leaking sensitive data.",
          steps: ["Store safe summaries.", "Redact payloads.", "Expose download or copy report."],
          codeSnippet: `trace.redact(["token", "ssn", "salaryExpectation"]);`,
        },
      ],
    },
  ],
  capstone: {
    title: "Capstone: Build the InterviewIQ Agent",
    summary:
      "Combine the Java backend track and React trust surface into a guided agent that analyzes a resume, compares a target role, proposes a practice plan, asks before scheduling, and explains every step.",
    milestones: [
      "Capture candidate goal and profile.",
      "Generate a visible plan with Spring Boot and ChatClient.",
      "Run resume and JD tools as explainable tool cards.",
      "Pause for approval before saving an interview schedule item.",
      "Render trace, guardrail labels, retry, and final prep summary.",
    ],
    acceptanceCriteria: [
      "The user can see every agent step without opening logs.",
      "Risky actions never execute without approval.",
      "The Java service owns validation, audit, and recovery state.",
      "The React UI shows stream, tool cards, approval, trace, and errors on mobile and desktop.",
      "The final report includes what happened, what was blocked, and what the user should do next.",
    ],
  },
};
