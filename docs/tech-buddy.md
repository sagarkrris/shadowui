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

“Speak concise explanation” summarizes long responses for speech while retaining
full explanations and code in the conversation. The generated spoken transcript
is available under “Spoken explanation.” Audio is kept in memory, never persisted.
Device voice remains selectable when Gemini TTS is unavailable; it prefers en-IN.
Speech recognition requests en-IN and may use the browser's recognition service.

## Live interviewer setup

Set these **server-only** environment variables in your deployment or `.env.local`:

```
LIVEAVATAR_API_KEY=<your provider key>
LIVEAVATAR_AVATAR_ID=<licensed avatar ID from your account>
LIVEAVATAR_SANDBOX=1
```

Use the provider’s sandbox avatar while testing (currently Wayne,
`dd73ea75-1218-4ef3-92ce-606d5f7fbc0a`); it is a connectivity test, not the final
Indian-presenting interviewer. Sandbox video lasts approximately one minute. For production, choose a licensed
Indian-presenting avatar with the appearance and gesture range you want, and set
`LIVEAVATAR_SANDBOX=0`. Restart the server after configuring the environment.
Then choose **Connect live interviewer** inside Tech Buddy.

The generated static portrait is not automatically converted into a LiveAvatar.
The connected video uses the configured provider avatar. Facial expression and
body movement fidelity depend on that avatar; there is no fabricated word-to-face
animation or stereotyped gesture mapping. Gemini's meaning-sensitive prosody drives
synchronized video, with explicit listening and idle states between utterances.

The integration uses LiveAvatar LITE, PCM 16-bit mono 24 kHz speech over its control
WebSocket, and a receive-only LiveKit room. The candidate's camera and microphone
are never published to that room. The provider receives generated spoken audio.
Only scoped session/viewer credentials reach the browser; master API keys and
agent tokens remain server-side. Tokens are never saved with practice history.

Video is opt-in, including for reduced-motion users. Disconnect to use the static
portrait. Video sessions follow your provider account’s duration limits; reconnect video
if a provider session expires. This does not limit the practice session.
Disconnect, End Session, navigation and unmount all close media resources and
request remote session termination. Provider idle/maximum duration limits remain
the fallback if a device loses power or its network disappears.

## Validation and limitations

Provider calls are bounded, authenticated using the app's existing auth policy,
and rate-limited. Failures keep written answers available. Speech cancellation
invalidates late responses; avatar events are matched to the current utterance.
No live provider credentials are required by tests: transport, failure, and cleanup
contracts use deterministic mocks. Verify real audio quality, chosen-avatar gesture
quality, autoplay behavior and production account quotas with your configured account
before enabling live video broadly.

Official integration references:
- [Gemini speech generation](https://ai.google.dev/gemini-api/docs/speech-generation)
- [LiveAvatar sandbox constraints](https://docs.liveavatar.com/docs/sandbox-mode)
- [LiveAvatar LITE lifecycle](https://docs.liveavatar.com/docs/lite-mode/lifecycle)
- [LiveAvatar control events](https://docs.liveavatar.com/docs/lite-mode/events)
- [LiveKit browser SDK](https://docs.livekit.io/reference/client-sdk-js/)
