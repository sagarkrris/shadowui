# InterviewIQ

AI-powered interview intelligence for modern software engineers. It supports personalized stack-based prep, mock interviews, DSA Visual Lab lessons, system design practice, behavioral coaching, company-specific prep, PrepOS Today guidance, resume gap analysis, JD Copilot role targeting, spaced weak-spot reviews, an interview tracker, screen analysis, voice input, code review practice, and a visual Agentic UI Engineering course.

## Features

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
- DSA Visual Lab with interview-focused animations, dry runs, memory hooks, code templates, quizzes, and "Practice as Mock" flows for Arrays, Strings, Hashing, Two Pointers, Stack/Queue, Trees, Graph BFS/DFS, and DP Basics.
- Answer Coach actions for "make it concise", "make it senior-level", "add metrics", "add trade-offs", and "convert to STAR" rewrites from the latest mock answer.
- Resume Bullet Generator that converts JD gaps and Proof Vault stories into ATS-friendly before/after resume bullets without inventing metrics.
- Career Toolkit with PDF/DOCX/TXT/Markdown resume gap analysis, JD Copilot match analysis, Role Pack Builder, role-specific mock prompts, must-know skills, likely questions, resume proof rewrites, 7-day crash plan, 1/3/7-day weak-spot review queue, interview scheduling tracker, daily streaks, XP, and badges.
- Question Memory and Mastery Map that remember answered practice cards locally, prioritize weak or stale questions, and show New, Needs Review, Improving, and Mastered status.
- Interview Recording Review for one-time transcript/coaching review without saving the raw transcript in local storage.
- System Design Canvas workspace for requirements, APIs, data, architecture, scaling, failure modes, security, observability, and rollout planning with review/mock actions.
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
- Code paste/review tools shown only where useful, such as technical prep topics.
- Live Code Runner marked as an upcoming feature while sandbox execution is paused.
- Screen capture/upload analysis for coding, design, database, and interview prompts.
- Voice input with helpful iOS/Safari fallback guidance.
- Responsive layout verified across phone, tablet, iPad, and desktop viewport sizes.

## Run Locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local and paste your GEMINI_API_KEY
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` with:

```bash
GEMINI_API_KEY=your-gemini-api-key
# Optional only when you are ready to enable live code execution:
# PISTON_EXECUTE_URL=https://your-piston-host.example.com/api/v2/execute
```

You can create a Gemini API key from Google AI Studio. Keep the key server-side only; browser requests go through the Next.js API routes.

The Live Code Runner is currently shown as an upcoming feature and `/api/run-code` returns a paused response unless `PISTON_EXECUTE_URL` is explicitly set to a self-hosted or approved Piston runner. The old public Piston endpoint became whitelist-only in February 2026. Do not paste secrets, tokens, proprietary code, or private stdin into any external runner.

## Useful Commands

```bash
npm run dev
npm run build
node --test test/*.test.mjs
npm run android:sync
npm run android:open
```

## Android App

The first Android version is a hosted WebView shell for `https://elevateprep.vercel.app`. This keeps Gemini, resume extraction, screen analysis, company prep, and other API workflows on the deployed Next.js server, so no AI keys are stored in the Android app.

```bash
npm install
npm run android:sync
npm run android:open
npm run android:build
```

Use Android Studio to install the Android SDK, run on an emulator/device, sign, and package the APK/AAB. Use Java 17 for the generated Capacitor 5 Gradle project. `npm run android:build` is cross-platform and chooses `gradlew.bat` on Windows or `./gradlew` on macOS/Linux. The app id is `com.sagarkrishna.interviewiq`, and the native shell requests microphone, camera, internet, and network-state permissions for voice input and upload-oriented WebView workflows.

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
│   ├── chat/              # Markdown messages, code blocks, typing dots, score badge and rubric UI
│   ├── company/           # Company Prep dashboard
│   ├── dsa/               # DSA Visual Lab learning workspace
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
├── lib/
│   ├── careerToolkit.mjs
│   ├── answerRubric.mjs
│   ├── chatMarkdown.mjs
│   ├── chatPrompt.mjs
│   ├── chatRequest.mjs
│   ├── codeRunner.mjs
│   ├── companyPrep.mjs
│   ├── dsaVisualLab.mjs
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
│   │   ├── analyze-screen.js
│   │   ├── chat.js
│   │   ├── company-prep.js
│   │   ├── extract-resume.js
│   │   ├── models.js
│   │   └── run-code.js
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
├── capacitor.config.json
├── android/              # Android hosted WebView shell
└── package.json
```

## API Flow

```text
Browser
  -> Next.js API route
  -> Gemini API or Piston API
  -> streamed response back to the browser
```

The browser never receives the Gemini API key. Code execution requests are blocked unless `PISTON_EXECUTE_URL` is explicitly configured, then proxied through `/api/run-code` to the configured Piston runner only when the user clicks Run.

## Notes

- Public company interview data is presented as reported/community-sourced, not official company material.
- Resume gap analysis in the Career Toolkit supports `.pdf`, `.docx`, `.txt`, `.md`, and pasted text. Extraction runs through InterviewIQ's own API route and is not sent to Gemini or external AI services; legacy `.doc` files should be converted to `.docx` or pasted as text.
- The Live Code Runner is paused in the UI for now. The API route returns `503` until a non-public, approved `PISTON_EXECUTE_URL` is configured; request-size safeguards remain in place for that future sandbox.
- Voice input depends on browser support. iOS Safari may require microphone permissions, Siri/dictation support, or keyboard dictation fallback.
