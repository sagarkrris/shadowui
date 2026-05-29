# Prep Operating System Design

## Goal

Upgrade InterviewIQ from separate prep widgets into a connected interview operating system with guided daily missions, job-description targeting, and reusable mock replay timelines.

## Scope

- Add Guided Prep Mission cards to the prep command surface.
- Expand Target Job Description into a JD Copilot with must-know skills, likely questions, resume rewrite suggestions, gap urgency, and a 7-day crash plan.
- Upgrade Mock Replay into a part-wise timeline that shows question, user answer, score, gaps, improved answer, and next actions.

## Architecture

- Keep the intelligence deterministic and local in `lib/prepInsights.mjs` and `lib/careerToolkit.mjs`.
- Use the existing `CareerToolkit` localStorage state for resume, JD, interview schedule, and activity data.
- Render the connected workflows inside `PrepInsightsPanel` and `CareerToolkit` without adding a database.

## Data Flow

- `CareerToolkit` produces resume/JD analysis and persists it locally.
- `PrepInsightsPanel` reads the saved toolkit state and combines it with mock scores, weak spots, messages, proof stories, and upcoming interviews.
- Buttons emit prompts through the existing `onAction` path so the current chat agent runs the drill.

## Error Handling

- Missing resume/JD/interview data produces useful fallback missions instead of empty panels.
- Old saved localStorage payloads are normalized so new arrays default to empty lists.
- Mock replay parsing falls back to readable previews when headings are missing.

## Testing

- Add pure function tests for mission generation, JD Copilot fields, and replay timeline steps.
- Add UI source tests for the new visible sections and action labels.
- Run the full existing test suite, lint, and build after implementation.
