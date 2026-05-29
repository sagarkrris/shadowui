# InterviewIQ Upgrade Pack Design

## Goal

Add five connected interview-prep upgrades without introducing a database or external scraping.

## Features

1. Company-Specific Prep Room: a dedicated company page with notes, rounds, JD gaps, likely questions, saved story references, and a final-day checklist.
2. Answer Coach: quick rewrite actions for scored mock answers: concise, senior-level, metrics, trade-offs, and STAR.
3. Resume Bullet Generator: impact-based, ATS-friendly, role-specific before/after bullets from JD gaps and Proof Vault stories.
4. Weak Spot Radar: a visual map of repeated answer weaknesses such as trade-offs, edge cases, complexity, communication, system design depth, and missing metrics.
5. Real Pressure Mode: a stricter interview calibration mode with timed, one-question, no-hints behavior and hire/no-hire scoring.

## Architecture

- Keep derived intelligence in local deterministic modules: `lib/prepInsights.mjs`, `lib/companyPrep.mjs`, and `lib/chatPrompt.mjs`.
- Render feature surfaces in existing app areas: Company Prep, Prep Insights, and chat score actions.
- Persist no new server state. Reuse localStorage-backed Career Toolkit data where available.

## Data Flow

- Company Prep reads Career Toolkit state for JD gaps/interviews and combines it with company question banks.
- Prep Insights reads chat messages, mock scores, weak spots, JD analysis, proof stories, and generates radar, answer coach actions, and resume bullets.
- Real Pressure Mode flows through existing `interviewMode` into `/api/chat` and the system prompt.

## Testing

- Add pure logic tests before implementation.
- Add UI source tests for visible labels and wiring.
- Run full tests, lint, build, and browser smoke where possible.
