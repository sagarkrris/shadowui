import { AI_SESSIONS, AI_INTERVIEWS, AI_REFERENCES } from "./aiEngineeringCurriculum.mjs";

export const PRODUCT_TAGLINE = "AI-powered interview intelligence for modern software engineers";

export const AGENTIC_UI_COURSE = {
  title: "AI for Software Engineers",
  kicker: "Teacher-Led Classroom Course",
  summary:
    "A practical classroom course for software engineers: learn AI and agentic systems through teacher-led explanations, student build exercises, peer-style debriefs, and detailed interview practice for real engineering roles.",
  classroom: {
    format: "6 sessions · 90-minute teaching plans · exercises and homework beyond class",
    teacherRole: "Frames the engineering decision, models a concise answer, and challenges unsafe assumptions.",
    studentRole: "Builds a small artifact, explains a trade-off aloud, and improves it after targeted feedback.",
  },
  findings: [
    "Start with model fundamentals and testable contracts before adding agent autonomy.",
    "Build the same study assistant progressively: budget context, validate output, retrieve evidence, evaluate, approve, and review.",
    "Separate deterministic software tests from held-out evaluation of real model quality.",
    "Keep authorization and consequential actions under application control, with readable traces and recovery.",
  ],
  lessons: AI_SESSIONS.map((session) => ({ ...session, visual: 'pipeline', buildThis: session.studentActivity })),
  classroomSessions: AI_SESSIONS,
  interviewQuestions: AI_INTERVIEWS,
  references: AI_REFERENCES,
  modules: AI_SESSIONS.map((session) => ({
    id: `module-${session.id}`,
    lessonId: session.id,
    sessionId: session.id,
    title: `Module ${session.stage}: ${session.title}`,
    outcome: session.description,
    image: { title: session.title, caption: session.plainMeaning, visual: 'pipeline', steps: session.flow },
    practice: session.studentActivity,
  })),
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
    title: "InterviewIQ Agent · Study Assistant Capstone",
    summary: "Deliver the local study-assistant workflow, explain each failure case, and propose a measured production extension. The reference implementation uses deterministic fixtures; optional stack tracks extend the same contracts.",
    milestones: AI_SESSIONS.map(session => session.title),
    acceptanceCriteria: [
      "Context overflow is rejected and malformed model output cannot reach the save step.",
      "Retrieval excludes other tenants before ranking and unsupported questions abstain.",
      "All five deterministic checks pass; their limits for real model quality are documented.",
      "Saving requires matching approval; stale approval fails and duplicate replay saves once.",
      "The submission includes a reviewed change, failure-case evidence, a cost estimate, and a held-out evaluation plan.",
      "The production design specifies durable authorization, audit, trace redaction, timeout recovery, and rollback.",
    ],
  },
};
