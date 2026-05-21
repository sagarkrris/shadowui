# Java Tech Lead Interview Assistant

AI-powered interview assistant for Java backend engineers. Covers Core Java, Spring Boot, Micronaut/OCI, DSA, System Design, and Behavioral rounds.

**Completely free** — runs on Vercel (free Hobby plan) + Google Gemini free tier (1,500 calls/day).

---

## Deploy to Vercel — Free, No Credit Card

### Step 1 — Get a Free Gemini API Key (2 minutes)
1. Go to **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **Create API Key** → copy it

That's it — no billing setup, no credit card.

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/java-interview-assistant.git
git push -u origin main
```

### Step 3 — Deploy on Vercel (free)
1. Go to **[vercel.com](https://vercel.com)** → Sign up free with GitHub
2. Click **Add New Project** → Import your repo
3. Under **Environment Variables**, add:
   - Name: `GEMINI_API_KEY`
   - Value: `AIza-your-key-here`
4. Click **Deploy** → live in ~60 seconds

Your app is live at `https://your-project.vercel.app` — forever free.

---

## Run Locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local → paste your GEMINI_API_KEY
npm run dev
# Open http://localhost:3000
```

---

## Free Tier Limits

| Service | Free Limit |
|---|---|
| Vercel Hosting | Unlimited |
| Gemini 2.0 Flash | 1,500 requests/day, 1M tokens/min |
| Custom domain | Free on Vercel |

For personal interview prep, 1,500 calls/day is more than enough.

---

## Project Structure

```
java-interview-assistant/
├── pages/
│   ├── index.js        # Full UI — sidebar, chat, streaming, code editor
│   ├── _app.js         # Global styles
│   ├── _document.js    # Fonts + Tabler icons
│   └── api/
│       └── chat.js     # Serverless route → Gemini API (key stays server-side)
├── styles/
│   └── globals.css     # Dark theme + animations
├── .env.example        # Env variable template
├── next.config.js
└── package.json
```

---

## How Streaming Works

```
Browser → POST /api/chat → Vercel Serverless Function → Gemini API (streaming)
                ↑
      Tokens streamed back via SSE
      API key never leaves server
```
