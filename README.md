# InterviewIQ

AI-powered interview intelligence for modern software engineers. It supports personalized stack-based prep, mock interviews, DSA and system design practice, behavioral coaching, company-specific prep, resume gap analysis, spaced weak-spot reviews, an interview tracker, screen analysis, voice input, live code practice, and a visual Agentic UI Basics mini-course.

## Features

- Personalized onboarding with name, target role, experience, and tech stack.
- Stack-aware themes, ambient background artwork, and prep topics for Java, Python, React, Node.js, JavaScript, SQL, PostgreSQL, MongoDB, AWS, Azure, Docker, Go, SAP, Ruby, Rust, and fallback full-stack prep.
- InterviewIQ logo mark in the sidebar brand area.
- Liquid Glass-inspired glossy panels, cards, controls, and modals that inherit the selected stack palette.
- Stack-flavored greetings such as Python-style and Java-style welcome messages.
- Locked first-run sidebar topics so users know they must complete target details before starting.
- Company Prep dashboard with curated public interview patterns, mock buttons, weak-spot tracking, behavioral prompts, and source links.
- Prep Command Center with readiness score, daily plan, focus signal, and one-click drills.
- Career Toolkit with PDF/DOCX/TXT/Markdown resume gap analysis, 1/3/7-day weak-spot review queue, interview scheduling tracker, daily streaks, XP, and badges.
- Agentic UI Basics mini-course with visual patterns for agent loops, autonomy, approvals, traces, and guardrails.
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
PISTON_EXECUTE_URL=https://your-piston-host.example.com/api/v2/execute
```

You can create a Gemini API key from Google AI Studio. Keep the key server-side only; browser requests go through the Next.js API routes.

The Live Code Runner is currently shown as an upcoming feature. The old public Piston endpoint became whitelist-only in February 2026; set `PISTON_EXECUTE_URL` to a self-hosted or approved Piston runner before re-enabling live execution. Do not paste secrets, tokens, proprietary code, or private stdin into any external runner.

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
│   ├── chat/              # Markdown messages, code blocks, typing dots, score badge
│   ├── company/           # Company Prep dashboard
│   ├── modals/            # Screen analysis and settings modals
│   ├── welcome/           # Profile setup, welcome screen, Career Toolkit, practice pack
│   │   └── PrepCommandCenter.js
│   ├── BrandLogo.js
│   ├── CodeRunner.js
│   ├── Sidebar.js
│   ├── TechBackground.js
│   ├── Toast.js
│   └── VoiceBar.js
├── lib/
│   ├── careerToolkit.mjs
│   ├── chatMarkdown.mjs
│   ├── codeRunner.mjs
│   ├── companyPrep.mjs
│   ├── personalization.mjs
│   ├── prepCoach.mjs
│   ├── prepTopics.mjs
│   ├── resumeExtract.mjs
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
└── package.json
```

## API Flow

```text
Browser
  -> Next.js API route
  -> Gemini API or Piston API
  -> streamed response back to the browser
```

The browser never receives the Gemini API key. Code execution requests are proxied through `/api/run-code` and sent to the configured Piston runner only when the user clicks Run.

## Notes

- Public company interview data is presented as reported/community-sourced, not official company material.
- Resume gap analysis in the Career Toolkit supports `.pdf`, `.docx`, `.txt`, `.md`, and pasted text. Extraction runs through InterviewIQ's own API route and is not sent to Gemini or external AI services; legacy `.doc` files should be converted to `.docx` or pasted as text.
- The Live Code Runner is paused in the UI for now. The API route and request-size safeguards remain in place for a future configured sandbox.
- Voice input depends on browser support. iOS Safari may require microphone permissions, Siri/dictation support, or keyboard dictation fallback.
- Build may warn about Google Font optimization if the font stylesheet cannot be fetched during build.
