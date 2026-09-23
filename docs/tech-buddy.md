# Tech Buddy

Tech Buddy uses ElevatePrep's existing Gemini chat and evaluation routes, profile,
selected topic and difficulty, shared conversation, and saved practice history.

## Conversation

- **Interview me** asks one question at a time. Submit typed or reviewed voice
  transcripts for structured feedback; retry the same question without inflating
  the completed-question count.
- **Ask Buddy** answers questions directly, with the existing Markdown and code
  renderer. These exchanges are not scored. Switching modes preserves the active
  interview question and its unfinished answer.
- **Give me a hint** returns a hint without submitting or scoring the draft.
- **Deeper follow-up** uses the latest answer and evaluation. **Revisit a gap**
  uses recent attempts from the same topic. Requests include bounded recent
  conversation and evidence; they do not send the entire stored history.
- The default session is unlimited. Choose 3, 5, 10, 15, 20, 30, 50, or 100 questions
  for a bounded session. Five questions remains a warm-up preset, not a cap on
  Tech Buddy. Changing topic, level, or length starts a fresh session while shared
  conversation and completed attempts remain saved.
- Returning to the regular conversation exposes the same questions, answers,
  explanations and feedback. They also survive reload and session export/import.
- The offline demo remains Java-only with 36 built-in questions and device speech.
  It makes no AI requests and does not persist answers or invent scores.

## Voice

Natural Indian English speech uses the existing `GEMINI_API_KEY`. The optional
`GEMINI_TTS_MODEL` defaults to `gemini-2.5-flash-preview-tts`; it must be an
AUDIO-capable Gemini TTS model accessible to that key. The voice is Charon with
prompted Indian English pronunciation and restrained, context-appropriate delivery.
These are generation directions, not a guarantee of a particular regional accent.

Each interview question is read aloud and, once playback finishes, Tech Buddy
starts browser speech recognition for the candidate's answer. The candidate can
mute the microphone, stop listening to edit the transcript, stop the speaker, or
replay a question, follow-up, or concise feedback. “Speak concise explanation”
summarizes long responses for speech while retaining full explanations and code
in the conversation. The generated spoken transcript is available under “Spoken
explanation.” Audio is kept in memory, never persisted. If Gemini TTS fails,
Tech Buddy automatically switches the session to the device voice; it prefers
en-IN. Speech recognition requests en-IN and may use the browser's recognition
service.

After an assessed answer, Tech Buddy speaks the generated relevant follow-up
first and then a short strengths-and-gaps review. The complete feedback, next
steps, and follow-up remain visible on screen.

## Voice-only interview mode

Tech Buddy intentionally uses voice without live video or camera permissions.
The interviewer portrait is static; spoken questions and feedback use Gemini TTS
or the device voice, and browser speech recognition can transcribe the candidate's
answer. Audio is kept in memory and is not persisted with practice history.

## Validation and limitations

Provider calls are bounded, authenticated using the app's existing auth policy,
and rate-limited. Failures keep written answers available. Speech cancellation
invalidates late responses, and deterministic mocks cover the voice transport.

Official integration reference:
- [Gemini speech generation](https://ai.google.dev/gemini-api/docs/speech-generation)
