# Android Hosted WebView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Android shell for InterviewIQ as a hosted WebView app.

**Architecture:** Add Capacitor to the existing Next.js project. The native Android shell points at the deployed InterviewIQ URL and delegates all AI/API behavior to the existing server.

**Tech Stack:** Next.js, Capacitor, Android WebView, Node test runner.

---

### Task 1: Android Packaging Contract

**Files:**
- Create: `test/androidPackaging.test.mjs`

- [ ] **Step 1: Write failing tests**

Create assertions for `capacitor.config.json`, `package.json`, `android/app/src/main/AndroidManifest.xml`, and `README.md`.

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test test/androidPackaging.test.mjs`

Expected: fails because Capacitor and Android files do not exist yet.

### Task 2: Capacitor Shell

**Files:**
- Create: `capacitor.config.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `android/**`

- [ ] **Step 1: Install Capacitor**

Run: `npm install @capacitor/core @capacitor/cli @capacitor/android`

- [ ] **Step 2: Add hosted config**

Use app id `com.sagarkrishna.interviewiq`, app name `InterviewIQ`, web dir `public`, and server URL `https://elevateprep.vercel.app`.

- [ ] **Step 3: Generate Android project**

Run: `npx cap add android`

### Task 3: Android Permissions And Docs

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `README.md`

- [ ] **Step 1: Add microphone and file-friendly permissions**

Add `RECORD_AUDIO`, `CAMERA`, and internet/network state permissions where appropriate for the WebView workflows.

- [ ] **Step 2: Document Android commands**

Add README steps for syncing, opening, and building Android.

### Task 4: Verification

**Files:**
- Test: `test/androidPackaging.test.mjs`

- [ ] **Step 1: Run targeted tests**

Run: `node --test test/androidPackaging.test.mjs`

- [ ] **Step 2: Run full verification**

Run:

```bash
node --test test/*.test.mjs
npm run lint
npm run build
```

- [ ] **Step 3: Confirm no dev ports are left running**

Check ports `3000`, `3001`, and `3002`.
