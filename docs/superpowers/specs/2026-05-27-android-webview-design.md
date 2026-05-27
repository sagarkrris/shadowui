# Android Hosted WebView Design

## Goal

Create a first Android version of InterviewIQ that opens the hosted web app in a native Android WebView while keeping all AI and API work on the existing server.

## Approach

Use Capacitor as a thin native shell. The Android app points to `https://elevateprep.vercel.app`, so the current Next.js API routes keep handling Gemini, resume extraction, screen analysis, company prep, and the paused code runner. The Android package does not include API keys.

## Native Identity

- App name: `InterviewIQ`
- Android package: `com.sagarkrishna.interviewiq`
- Initial hosted URL: `https://elevateprep.vercel.app`

## Capabilities

The first version supports the same hosted app workflows through WebView:

- Voice input through microphone permission.
- Resume upload and image/screen workflows through WebView file chooser support.
- Existing local session persistence through WebView storage.
- Hosted updates without rebuilding the APK.

## Out Of Scope For First Slice

- Offline mode.
- Push notifications.
- Native auth.
- Native rewritten screens.
- Embedding Gemini or other AI keys in Android.

## Validation

Static tests should verify that the Capacitor config, Android manifest, package metadata, and README all describe a hosted Android WebView app with the correct app id, app name, hosted URL, and key permissions.
