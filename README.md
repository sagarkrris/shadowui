# InterviewIQ

AI-powered interview intelligence for modern software engineers. It supports personalized stack-based prep, mock interviews, beginner-friendly DSA thinking systems, visual DSA lessons, system design practice, behavioral coaching, company-specific prep, PrepOS Today guidance, resume gap analysis, JD Copilot role targeting, spaced weak-spot reviews, an interview tracker, screen analysis, voice input, answer rewrite coaching, code explanation judging, code review practice, and a visual Agentic UI Engineering course.

## Features

- [Java engineering practice](docs/build-practice.md): twelve original challenges with editable starters, downloadable Java 17 checks, hints, references, browser progress and optional AI review. Live execution is opt-in; runner provisioning is deferred.

- Personalized onboarding with name, target role, experience, and tech stack.
- Stack-aware themes, ambient background artwork, and prep topics for Java, Python, React, Node.js, JavaScript, SQL, PostgreSQL, MongoDB, AWS, Azure, Docker, Go, SAP, Ruby, Rust, and fallback full-stack prep.
- InterviewIQ logo mark in the sidebar brand area.
- Liquid Glass-inspired glossy panels, cards, controls, and modals that inherit the selected stack palette.
- Stack-flavored greetings such as Python-style and Java-style welcome messages.
- Locked first-run sidebar topics so users know they must complete target details before starting.
- Company Prep dashboard and Company-Specific Prep Room with role context, interview rounds, JD gaps, likely questions, story references, final-day checklist, mock buttons, weak-spot tracking, behavioral prompts, and source links.
- Prep Command Center with offer readiness score, progress dashboard, answer quality heatmap, Weak Spot Radar, mock replay, daily plan, focus signal, and one-click drills.
- PrepOS Today dashboard that explains what to practice now, why it matters, upcoming risks, weak topics due, top saved story, and next mock recommendation.
- Smart Prep Timeline that shows the journey from profile, resume, JD, mock baseline, weak spots, mastered questions, proof stories, scheduled interview, and final pack.
- Guided Prep Mission board that converts resume gaps, JD gaps, weak spots, mock scores, proof stories, and upcoming interviews into three concrete next actions.
- Unified Progress Brain with real workspace activity events, readiness lanes for DSA, scenarios, company prep, Java, and system design, current-step Beginner Path tracking, a practice replay timeline, and exportable daily prep plans.
- DSA Visual Lab with a How To Approach track, beginner-friendly Pattern Atlas, DSA Visual Playground, Big-O Cheat Sheet, operation matrix, DSA Thinking System, Drill Room question-answer practice, interview-focused animations, Explain-Then-Code Mode, dry runs, memory hooks, selected-stack code templates, quizzes, local mastery progress, mistake replay, test-case training, and "Practice as Mock" flows for Arrays, Strings, Hashing, Two Pointers, Stack/Queue, Trees, Graph BFS/DFS, and DP Basics.
- Blind 75 Visual Track inside DSA Lab with Featured 15, All 75, difficulty, Weak, Not Started, and Mastered filters, reusable pattern visualizers, original dry-run explanations, invariants, edge cases, code walkthroughs, quizzes, and selected-stack Java/Python/JavaScript/Ruby/Rust code templates.
- Answer Coach actions for "make it concise", "make it senior-level", "add metrics", "add trade-offs", and "convert to STAR" rewrites from the latest mock answer.
- Answer Rewrite Studio after completed chat answers with original, concise, senior, STAR, metrics-added, and interviewer-ready final versions.
- Code Explanation Judge for dry-run/code explanations that checks invariant, edge cases, complexity, and trade-offs without running code.
- Resume Bullet Generator that converts JD gaps and Proof Vault stories into ATS-friendly before/after resume bullets without inventing metrics.
- Career Toolkit with PDF/DOCX/TXT/Markdown resume gap analysis, JD Copilot match analysis, Role Pack Builder, role-specific mock prompts, must-know skills, likely questions, resume proof rewrites, 7-day crash plan, 1/3/7-day weak-spot review queue, interview scheduling tracker, daily streaks, XP, and badges.
- Question Memory and Mastery Map that remember answered practice cards locally, prioritize weak or stale questions, and show New, Needs Review, Improving, and Mastered status.
- Interview Recording Review for one-time transcript/coaching review without saving the raw transcript in local storage.
- System Design Canvas workspace for requirements, APIs, data, architecture, scaling, failure modes, security, observability, and rollout planning with review/mock actions.
- Design Lab with design patterns, HLD and LLD tracks, pictorial workflow diagrams, Java/Spring examples, interview traps, and practice systems.
- Java Digest workspace with AI-generated interview-ready topic search, Java/Spring Boot/concurrency/SQL/architecture tracks, and an original Java-only competitive programming curriculum with article-style cards, interview questions, roadmap plans, and coach/mock handoffs.
- Proof Vault / Story Bank that turns strong mock answers into reusable STAR stories with skills proven, impact metrics, weak spots, and behavioral/system design/resume actions.
- Interview Calibration Mode for Strict Interviewer, Coach Mode, Bar Raiser, Behavioral STAR, and Real Pressure interview styles.
- Round Strategy Mode for Recruiter, Coding, System Design, Manager, and Final interview rounds.
- AI Interview Panel Mode for Recruiter, Senior Engineer, Engineering Manager, System Design Architect, and Bar Raiser panel behavior with different follow-ups and rubrics.
- Answer Review Mode with rubric sliders for correctness, depth, examples, trade-offs, communication clarity, and follow-up readiness.
- Skill Graph that maps Java Core, Spring Boot, SQL, System Design, Behavioral, DSA, React, and stack-derived topics into New, Weak, Improving, Strong, and Mastered readiness nodes.
- Resume Story Matcher that turns resume claims such as performance, APIs, migrations, leadership, reliability, and cost into proof-story prompts without inventing metrics.
- Part-wise Mock Replay Timeline that breaks scored mocks into question, user answer, score, gaps, ideal answer, improved answer, and follow-up actions.
- Interview Day Pack for scheduled interviews with company/role context, JD gaps, likely questions, saved proof stories, and warm-up drills.
- Exportable final interview report with candidate details, resume gaps, job description match, mock performance, mastery map, role pack, system design canvas summary, roadmap, and next actions.
- Agentic UI Engineering course with Java/Spring Boot, React/Next.js, Node/Python, and enterprise adapter tracks for agent loops, tool calling, approvals, traces, streaming, and guardrails.
- Chat-based interview and practice modes with difficulty levels.
- Tech Buddy shares ElevatePrep's conversation and practice history across **Interview me** and unscored **Ask Buddy** modes. It supports any selected topic, hints, adaptive follow-ups, gap revision, unlimited practice and configurable question counts. It reuses Gemini chat/evaluation and adds optional natural Indian English narration.
- Java lesson links and the Interview Day Pack open topic practice or a five-question preset. `/tech-buddy-demo` retains the original 36 offline Java questions with no AI calls or scoring.
- The fictional interviewer portrait is the local fallback. Optional LiveAvatar LITE video receives Gemini speech for lip sync and listening/idle poses; it requires server-side provider credentials and a licensed avatar ID. See [Tech Buddy setup and behavior](docs/tech-buddy.md).
- Code paste/review tools shown only where useful, such as technical prep topics.
- Self-hosted Java Runner with selectable JDK 8 through JDK 21.
- Screen capture/upload analysis for coding, design, database, and interview prompts.
- Voice input with helpful iOS/Safari fallback guidance.
- Responsive layout verified across phone, tablet, iPad, and desktop viewport sizes.

## Public learning UI

The public homepage and learning pages use grouped Learn, Practice, Interview, and Resources navigation. Search opens from the header or Cmd/Ctrl+K and filters public courses, chapters, articles, labs, and Java challenges. `/api/discovery` serves only public metadata; saved notebook notes are added in the browser and are not transmitted to that endpoint. If the index fails to load, navigation shortcuts and local notes remain available with a retry action.

The homepage includes a fixed-sequence LRU teaching preview, catalogue-derived counts, four learning paths, and links into the existing practice workspace. The learning hub supports course-category filters; the notebook searches saved evidence and filters activity status without rewriting stored records. Existing onboarding, AI endpoints, and runner configuration are unchanged.

Returning learners see saved practice, roadmap, notebook, and reading shortcuts above the homepage introduction. Lesson practice links preserve the originating topic and offer a five-question quick start with disclosed general practice defaults; a personal profile remains optional for that handoff. Public and workspace search use the same public catalogue, with locally searched notebook/bookmark records and paginated results. Workspace search also includes saved attempts and designs. The notebook offers Markdown download with a copy fallback, Undo for the last removed note, and full JSON backup/restore with readable counts and dates. JSON restore replaces only the workspaces listed in its preview; Markdown is a portable reading export, not a restore format.

The learning hub prioritizes your selected roadmap and shows why it suggests a different path after completion. Saved Buddy questions and drafts resume directly from the homepage. Due reviews include mastered questions and reopen the original prompt with its previous evidence when available. Practice review offers a saved study/exercise/retest workflow; roadmap completion remains explicitly self-assessed. Today supports 5-, 15-, and 30-minute plans with persistent checklists and reflections (suggested budgets, not enforced timers). Application records support stage and follow-up updates, saved interview debriefs, round preparation, and explicit debrief-to-review handoff. None of these actions sends recruiter messages or creates external calendar events.

Device continuity and retention: signing out offers a full private backup before clearing device data. Active notebooks hold 100 notes; new notes at capacity are refused without removing older notes. Archive notes to make room; archived notes remain readable, exported and included in account learning sync. Completing or replacing prep plans retains dated history. Practice-session answers are linked using a baseline of existing attempts.

Cloud state saves use an atomic database revision check. A stale device receives a conflict instead of overwriting newer work. The workspace pauses saving, offers restorable recovery backups, and lets you choose the device or cloud copy. Differing meaningful work discovered during startup also requires a choice. This is copy recovery, not an automatic field merge. Notebook, archive, bookmarks, roadmap and reading positions join account sync when the practice workspace opens; other browser-only workspaces remain covered by full JSON backup. Existing databases acquire the revision column during persistence initialization (`npm run db:migrate` uses the same initializer). Older clients without a revision must reload before saving.

Application rounds can be scheduled with an IANA time zone and linked application ID; rescheduling edits the same record consumed by the toolkit and day pack. Calendar downloads use UTC instants and a clearly labeled one-hour placeholder, and never send invitations. Historical completed interviews are allowed. Assessment review preserves original feedback, records dispute/reference notes, excludes disputed scores from summaries and practice recommendations, and supports a separate reassessment without treating the same answer as a fresh practice completion. Reassessments remain excluded until the user checks and accepts them.

## Run Locally

```bash
npm ci
cp .env.example .env.local
# Edit .env.local and paste your GEMINI_API_KEY
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` with:

```bash
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=<long_random_secret_1>
APP_ENCRYPTION_KEY=<long_random_secret_2>
# Require verified accounts for AI endpoints in production.
REQUIRE_AUTH=1
# Optional explicit stable Gemini model list, comma separated.
# GEMINI_MODEL_ALLOWLIST=gemini-2.5-flash,gemini-2.0-flash
# Shared serverless rate limiting (Upstash Redis REST)
# UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
# Auth email delivery webhook
# EMAIL_WEBHOOK_URL=https://your-email-service.example/api/send
# EMAIL_WEBHOOK_TOKEN=your_email_service_token
# Resend transactional email delivery (preferred)
# RESEND_API_KEY=re_your_resend_api_key
# RESEND_FROM_EMAIL=InterviewIQ <onboarding@resend.dev>
# APP_BASE_URL=https://elevateprep.vercel.app
# Optional Google sign-in (register callback at /api/auth?action=oauth-callback&provider=google)
# GOOGLE_CLIENT_ID=your_google_oauth_client_id
# GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
# Optional error tracking and AI cost estimates
# ERROR_TRACKING_WEBHOOK_URL=https://your-monitoring.example/api/events
# ERROR_TRACKING_TOKEN=your_monitoring_token
# GEMINI_INPUT_COST_PER_MILLION=0
# GEMINI_OUTPUT_COST_PER_MILLION=0
# Private self-hosted Java runner; never expose this token to the browser.
# JAVA_RUNNER_URL=http://java-runner.internal:8080
# JAVA_RUNNER_SHARED_TOKEN=replace-with-a-long-random-secret
```

You can create a Gemini API key from Google AI Studio. Keep the key server-side only; browser requests go through the Next.js API routes.

The Java runner is an InterviewIQ-owned service. Deploy it on a dedicated Docker host as described in [services/java-runner/README.md](services/java-runner/README.md); it supports Java 8 through Java 21 and is reachable only from the web application over a private network.

## Useful Commands

```bash
npm run dev
npm run build
node --test test/*.test.mjs
```

## Deploy To Vercel

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Add `GEMINI_API_KEY` under Environment Variables.
4. Deploy.

The app uses Next.js API routes so the Gemini key stays on the server.

## Project Structure

```text
shadowui/
├── components/
│   ├── chat/              # Markdown messages, code blocks, post-answer rewrite/judge tools, typing dots, score badge and rubric UI
│   ├── company/           # Company Prep dashboard
│   ├── dsa/               # DSA Visual Lab learning workspace
│   ├── java-digest/       # Java tutorial-style topic hub and interview drills
│   ├── modals/            # Screen analysis and settings modals
│   ├── system-design/     # System Design Canvas workspace
│   ├── welcome/           # Profile setup, welcome screen, Career Toolkit, prep insights, practice pack
│   │   ├── PrepCommandCenter.js
│   │   └── PrepInsightsPanel.js
│   ├── BrandLogo.js
│   ├── CodeRunner.js
│   ├── Sidebar.js
│   ├── TechBackground.js
│   ├── Toast.js
│   └── VoiceBar.js
├── hooks/                 # Client state and cloud-sync hooks
├── lib/
│   ├── interviewSession.mjs
│   ├── requestSecurity.mjs
│   ├── serverPersistence.mjs
│   ├── careerToolkit.mjs
│   ├── answerRubric.mjs
│   ├── blind75VisualTrack.mjs
│   ├── chatMarkdown.mjs
│   ├── chatPrompt.mjs
│   ├── chatRequest.mjs
│   ├── codeRunner.mjs
│   ├── companyPrep.mjs
│   ├── dsaVisualLab.mjs
│   ├── javaDigest.mjs
│   ├── interviewPanel.mjs
│   ├── personalization.mjs
│   ├── prepCoach.mjs
│   ├── prepInsights.mjs
│   ├── prepOperatingSystem.mjs
│   ├── prepReport.mjs
│   ├── questionMemory.mjs
│   ├── resumeStoryMatcher.mjs
│   ├── rolePacks.mjs
│   ├── skillGraph.mjs
│   ├── prepTopics.mjs
│   ├── resumeExtract.mjs
│   ├── sessionPersistence.mjs
│   ├── systemDesignCanvas.mjs
│   ├── prompts.mjs
│   ├── techTheme.mjs
│   ├── uiVisibility.mjs
│   └── voiceSupport.mjs
├── pages/
│   ├── api/
│   │   ├── auth.js
│   │   ├── analyze-screen.js
│   │   ├── chat.js
│   │   ├── company-prep.js
│   │   ├── extract-resume.js
│   │   ├── evaluate.js
│   │   ├── models.js
│   │   ├── state.js
│   │   └── run-code/
│   ├── _app.js
│   ├── _document.js
│   └── index.js
├── public/
│   └── favicon.svg
├── styles/
│   └── globals.css
├── test/
│   └── *.test.mjs
├── .env.example
├── next.config.js
└── package.json
```

## API Flow

```text
Browser
  -> Next.js API route
  -> Gemini API or the private InterviewIQ Java runner
  -> streamed response back to the browser
```
