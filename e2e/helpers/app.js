import { expect } from "@playwright/test";

export const SESSION_STORAGE_KEY = "interviewprep.session.v1";

export const reactJavaProfile = {
  name: "Sagar",
  position: "Full Stack Engineer",
  experience: "5-7 years",
  stack: "React, Java, SQL, AWS",
};

export const javaBackendProfile = {
  name: "Priya",
  position: "Backend Engineer",
  experience: "2-4 years",
  stack: "Java, Spring Boot, SQL",
};

export function createSessionSnapshot({
  profile = reactJavaProfile,
  selectedCat = "Frontend",
  selectedSub = "React & Next.js",
  activeTab = "chat",
  mode = "interview",
  difficulty = "Mid",
  messages = [],
} = {}) {
  return {
    version: 1,
    savedAt: new Date("2026-06-02T00:00:00.000Z").toISOString(),
    snapshot: {
      candidateProfile: profile,
      profileDraft: profile,
      messages,
      selectedCat,
      selectedSub,
      expandedCat: selectedCat,
      mode,
      interviewMode: "strict",
      roundStrategy: "coding",
      interviewPanel: "seniorEngineer",
      difficulty,
      activeTab,
    },
  };
}

export async function gotoCleanApp(page) {
  await page.addInitScript(() => {
    if (window.localStorage.getItem("__interviewiq_e2e_storage_ready__") !== "1") {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("__interviewiq_e2e_storage_ready__", "1");
    }
    window.__INTERVIEWIQ_ALERTED__ = false;
    window.alert = () => {
      window.__INTERVIEWIQ_ALERTED__ = true;
    };
  });
  await page.goto("/");
}

export async function gotoSeededApp(page, options = {}) {
  const session = createSessionSnapshot(options);
  await page.addInitScript(({ key, value }) => {
    if (window.localStorage.getItem("__interviewiq_e2e_storage_ready__") !== "1") {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem("__interviewiq_e2e_storage_ready__", "1");
    }
    window.__INTERVIEWIQ_ALERTED__ = false;
    window.alert = () => {
      window.__INTERVIEWIQ_ALERTED__ = true;
    };
  }, { key: SESSION_STORAGE_KEY, value: session });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start mock round" })).toBeVisible();
}

export async function completeOnboarding(page, profile = reactJavaProfile) {
  await page.getByLabel("Name").fill(profile.name);
  await page.getByLabel("Position").fill(profile.position);
  await page.getByLabel("Years of experience").selectOption(profile.experience);
  await page.getByLabel("Tech stack").fill(profile.stack);
  await page.getByRole("button", { name: "Personalize Prep" }).click();
  await expect(page.getByRole("button", { name: "Start mock round" })).toBeVisible();
}

export async function openSidebar(page) {
  const frontendButton = page.getByRole("button", { name: "Frontend" });
  if (await frontendButton.isVisible().catch(() => false)) return;
  await page.getByRole("button", { name: "Topics" }).click();
  await expect(frontendButton).toBeVisible();
}

export async function assertHealthyApp(page) {
  await expect(page.getByText("404")).toHaveCount(0);
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
}

export async function mockChat(page, responder) {
  const requests = [];
  await page.route("**/api/chat", async (route) => {
    const requestBody = route.request().postDataJSON();
    requests.push(requestBody);
    const text = typeof responder === "function"
      ? await responder(requestBody)
      : responder;

    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache",
      },
      body: `data: ${JSON.stringify({ text })}\n\ndata: [DONE]\n\n`,
    });
  });
  return requests;
}

export async function mockDsaChallenges(page, { fail = false } = {}) {
  await page.route("**/api/dsa-challenges", async (route) => {
    if (fail) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Simulated model outage" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "generated",
        model: "mock-gemini",
        challenges: [
          {
            id: "generated-mcq-1",
            lessonId: "arrays",
            type: "mcq",
            typeLabel: "MCQ",
            title: "Fresh Mock Array Trap",
            difficulty: "Medium",
            prompt: "Which invariant prevents a two-pointer scan from skipping a valid pair?",
            codeSnippet: "",
            choices: [
              { id: "a", text: "Move both pointers every loop." },
              { id: "b", text: "Only discard a side when the sorted-order comparison proves it cannot help." },
              { id: "c", text: "Hash every pair before scanning." },
              { id: "d", text: "Sort descending and stop early." },
            ],
            correctChoiceId: "b",
            explanation: "The comparison gives a proof for discarding one side while preserving all possible valid pairs.",
            trick: "Moving both pointers can skip the answer.",
            tricky: true,
            tags: ["Arrays", "Two pointers"],
          },
          {
            id: "generated-quant-1",
            lessonId: "hashing",
            type: "quantitative",
            typeLabel: "Quantitative",
            title: "Hash Table Capacity Math",
            difficulty: "Medium",
            prompt: "At 75% load factor, how many buckets are needed for 900 keys?",
            codeSnippet: "",
            choices: [
              { id: "a", text: "675" },
              { id: "b", text: "900" },
              { id: "c", text: "1200" },
              { id: "d", text: "1800" },
            ],
            correctChoiceId: "c",
            explanation: "900 divided by 0.75 gives 1200 buckets before crossing the load threshold.",
            trick: "Do not multiply by the load factor when you need capacity.",
            tricky: true,
            tags: ["Hashing", "Quantitative"],
          },
        ],
      }),
    });
  });
}
