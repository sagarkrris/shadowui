# ShadowPrep - Full Stack Interview Assistant

AI-powered interview prep for full stack developers. It supports personalized stack-based prep, mock interviews, DSA and system design practice, behavioral coaching, company-specific prep, screen analysis, and voice input.

## Features

- Personalized onboarding with name, target role, experience, and tech stack.
- Stack-aware themes, ambient background artwork, and prep topics for Java, Python, React, Node.js, JavaScript, PostgreSQL, MongoDB, AWS, Azure, Docker, Go, and fallback full-stack prep.
- Liquid Glass-inspired glossy panels, cards, controls, and modals that inherit the selected stack palette.
- Stack-flavored greetings such as Python-style and Java-style welcome messages.
- Locked first-run sidebar topics so users know they must complete target details before starting.
- Company Prep dashboard with curated public interview patterns, mock buttons, weak-spot tracking, behavioral prompts, and source links.
- Prep Command Center with readiness score, daily plan, focus signal, and one-click drills.
- Chat-based interview and practice modes with difficulty levels.
- Code paste/review tools shown only where useful, such as technical prep topics.
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
```

You can create a Gemini API key from Google AI Studio. Keep the key server-side only; browser requests go through the Next.js API routes.

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
│   ├── welcome/           # Profile setup and welcome screen
│   │   └── PrepCommandCenter.js
│   ├── Sidebar.js
│   ├── TechBackground.js
│   ├── Toast.js
│   └── VoiceBar.js
├── lib/
│   ├── chatMarkdown.mjs
│   ├── companyPrep.mjs
│   ├── personalization.mjs
│   ├── prepCoach.mjs
│   ├── prepTopics.mjs
│   ├── prompts.mjs
│   ├── techTheme.mjs
│   ├── uiVisibility.mjs
│   └── voiceSupport.mjs
├── pages/
│   ├── api/
│   │   ├── analyze-screen.js
│   │   ├── chat.js
│   │   ├── company-prep.js
│   │   └── models.js
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
  -> Gemini API
  -> streamed response back to the browser
```

The browser never receives the Gemini API key.

## Notes

- Public company interview data is presented as reported/community-sourced, not official company material.
- Voice input depends on browser support. iOS Safari may require microphone permissions, Siri/dictation support, or keyboard dictation fallback.
- Build may warn about Google Font optimization if the font stylesheet cannot be fetched during build.
