import { expect, test } from '@playwright/test';
import { gotoSeededApp, mockChat } from './helpers/app.js';
test.use({ serviceWorkers: 'block' });
const evaluation = { score: 8, confidence: 'medium', strengths: ['Clear decision process'], gaps: ['Define follow-up'], recommendations: ['Review the outcome'], dimensions: [], followUp: 'How do you measure alignment?' };
const buddyRegion = page => page.getByRole('region', { name: 'Tech Buddy interview', exact: true });
async function openBuddy(page) {
  await gotoSeededApp(page);
  await page.getByRole('button', { name: 'Open Tech Buddy', exact: true }).click();
  return buddyRegion(page);
}
async function submitAnswer(buddy, text = 'Agree on decision criteria and hear each engineer before deciding.') {
  await buddy.getByLabel('Your interview answer', { exact: true }).fill(text);
  await buddy.getByRole('button', { name: 'Submit answer', exact: true }).click();
}
async function saved(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('interviewprep.session.v1')).snapshot.practice); }

test('evaluation locks Next and level, deduplicates keyboard events, and persists retry across reload', async ({ page }) => {
  const requests = await mockChat(page, 'How would you handle a disagreement between senior engineers?');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  await page.route('**/api/evaluate', async route => {
    const body = route.request().postDataJSON();
    expect(body.difficulty).toBe('Senior Manager');
    expect(body.round).toBe('manager');
    calls++;
    if (calls === 1) { await gate; return route.fulfill({ status: 503, json: { error: 'Temporary outage' } }); }
    await route.fulfill({ json: { evaluation } });
  });
  const buddy = await openBuddy(page);
  await buddy.getByLabel('Tech Buddy level').selectOption('manager');
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await expect(buddy.getByRole('article', { name: 'Interviewer question' })).toContainText('disagreement');
  expect(requests[0].interviewPanel).toBe('engineeringManager');
  await buddy.getByLabel('Your interview answer', { exact: true }).fill('I establish criteria before making a decision.');
  await buddy.getByLabel('Your interview answer', { exact: true }).evaluate(element => {
    for (let i = 0; i < 3; i++) element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
  });
  await expect.poll(() => calls).toBe(1);
  await page.getByRole('button', { name: 'Follow-up', exact: true }).click();
  await expect(page.getByText('Use the Tech Buddy controls, or return to the conversation first.', { exact: true })).toBeVisible();
  expect(requests.length).toBe(1);
  await expect(buddy.getByRole('button', { name: 'Next Buddy question' })).toBeDisabled();
  await expect(buddy.getByLabel('Tech Buddy level')).toBeDisabled();
  release();
  await expect(buddy.getByRole('button', { name: 'Retry Buddy request' })).toBeVisible();
  await expect.poll(async () => (await saved(page)).buddy?.phase).toBe('error');
  const pendingId = (await saved(page)).buddy.pending.id;
  await page.reload();
  await page.getByRole('button', { name: 'Open Tech Buddy', exact: true }).click();
  await buddy.getByRole('button', { name: 'Retry Buddy request' }).click();
  await expect(buddy.getByRole('article', { name: 'Tech Buddy feedback' })).toContainText('8/10');
  await expect.poll(async () => (await saved(page)).attempts.length).toBe(1);
  expect((await saved(page)).attempts[0].id).toBe(pendingId);
  await buddy.getByLabel('Tech Buddy level').selectOption('fresher');
  await expect(buddy.getByRole('article', { name: 'Tech Buddy feedback' })).toHaveCount(0);
  await expect(buddy.getByRole('article', { name: 'Interviewer question' })).not.toContainText('disagreement');
  await expect.poll(async () => (await saved(page)).buddy.turns.length).toBe(0);
  expect((await saved(page)).attempts.length).toBe(1);
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await buddy.getByLabel('Your interview answer', { exact: true }).fill('Unsubmitted draft');
  await buddy.getByLabel('Tech Buddy level').selectOption('senior');
  await expect(buddy.getByLabel('Your interview answer', { exact: true })).toHaveValue('');
  await expect(buddy.getByRole('article', { name: 'Interviewer question' })).not.toContainText('disagreement');
});

test('five-question warm-up counts retry once, renders strengths and gaps, and finishes with summary', async ({ page }) => {
  let generated = 0;
  const requests = await mockChat(page, () => `Explain Java scenario ${++generated}.`);
  await page.route('**/api/evaluate', route => route.fulfill({ json: { evaluation } }));
  await gotoSeededApp(page);
  await page.getByRole('button', { name: 'Five-question interview warm-up' }).click();
  const buddy = buddyRegion(page);
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await submitAnswer(buddy);
  const feedback = buddy.getByRole('article', { name: 'Tech Buddy feedback' });
  await expect(feedback).toContainText('Clear decision process');
  await expect(feedback).toContainText('Define follow-up');
  await buddy.getByRole('button', { name: 'Try this question again' }).click();
  await submitAnswer(buddy, 'An improved answer with an explicit follow-up.');
  await expect(buddy.getByLabel('Warm-up progress')).toContainText('1 of 5');
  for (let i = 2; i <= 5; i++) {
    await buddy.getByRole('button', { name: 'Next Buddy question' }).click();
    await submitAnswer(buddy, `Answer for scenario ${i}`);
    await expect(buddy.getByLabel('Warm-up progress')).toContainText(`${i} of 5`);
  }
  const summary = buddy.getByRole('region', { name: 'Tech Buddy session summary' });
  await expect(summary).toContainText('5 questions completed · 6 attempts · 8/10 average');
  await expect(summary).toBeFocused();
  expect(requests.length).toBe(5);
  await expect(buddy.getByRole('button', { name: 'Next Buddy question' })).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).attempts.length).toBe(6);
  await summary.screenshot({ path: '/private/tmp/tech-buddy-summary.png' });
});

async function mockMedia(page, delayedCamera = false) {
  await page.addInitScript(({ delayedCamera }) => {
    window.__mediaEvents = [];
    const log = value => window.__mediaEvents.push(value);
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel: () => log('speech-cancel'), speak: utterance => { log('speak'); window.__utterance = utterance; } } });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.SpeechRecognition = class {
      start() { window.__recognition = this; log('listen'); }
      abort() { log('recognition-abort'); }
    };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => {
      const stream = new MediaStream();
      stream.getTracks = () => [{ stop: () => log('camera-stop') }];
      return delayedCamera ? new Promise(resolve => { window.__finishCamera = () => resolve(stream); }) : Promise.resolve(stream);
    } } });
  }, { delayedCamera });
}

test('voice stops speech before listening, aborts recognition before submit, ignores late events, and releases camera on end', async ({ page }) => {
  await mockMedia(page);
  await mockChat(page, 'Explain synchronization.');
  let evaluations = 0;
  await page.route('**/api/evaluate', async route => {
    evaluations++;
    expect(await page.evaluate(() => window.__mediaEvents.at(-1))).toBe('speech-cancel');
    expect(await page.evaluate(() => window.__mediaEvents)).toContain('recognition-abort');
    await route.fulfill({ json: { evaluation } });
  });
  const buddy = await openBuddy(page);
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await buddy.getByLabel('Speech voice', { exact: true }).selectOption('device');
  await buddy.getByRole('button', { name: 'Read question aloud' }).click();
  expect(await page.evaluate(() => window.__utterance.lang)).toBe('en-IN');
  await expect(buddy.getByText('Preparing speech…', { exact: true })).toBeVisible();
  await page.evaluate(() => window.__utterance.onstart());
  await expect(buddy.getByText('Speaking', { exact: true })).toBeVisible();
  await buddy.getByRole('button', { name: 'Speak answer' }).click();
  expect(await page.evaluate(() => window.__recognition.lang)).toBe('en-IN');
  await page.evaluate(() => window.__utterance.onstart());
  await expect(buddy.getByText('Speaking', { exact: true })).toHaveCount(0);
  expect((await page.evaluate(() => window.__mediaEvents)).slice(-2)).toEqual(['speech-cancel', 'listen']);
  await page.evaluate(() => {
    const result = [{ transcript: 'Lock around the shared counter.' }]; result.isFinal = true;
    window.__recognition.onresult({ results: [result] });
    window.__lateResult = window.__recognition.onresult;
    window.__lateEnd = window.__recognition.onend;
  });
  await expect(buddy.getByLabel('Your interview answer', { exact: true })).toHaveValue('Lock around the shared counter.');
  await buddy.getByRole('button', { name: 'Submit answer', exact: true }).click();
  await expect(buddy.getByRole('article', { name: 'Tech Buddy feedback' })).toBeVisible();
  await page.evaluate(() => { window.__lateEnd(); window.__lateResult({ results: [[{ transcript: 'Late answer' }]] }); });
  expect(evaluations).toBe(1);
  await buddy.getByRole('button', { name: 'Turn camera on' }).click();
  await expect(buddy.getByRole('button', { name: 'Turn camera off' })).toBeVisible();
  await buddy.getByRole('button', { name: 'Try this question again' }).click();
  await buddy.getByRole('button', { name: 'Speak answer' }).click();
  await buddy.getByRole('button', { name: 'End session', exact: true }).click();
  expect(await page.evaluate(() => window.__mediaEvents)).toContain('camera-stop');
  expect((await page.evaluate(() => window.__mediaEvents)).filter(item => item === 'recognition-abort')).toHaveLength(2);
  await expect(buddy.getByRole('region', { name: 'Tech Buddy session summary' })).toBeVisible();
});

test('late camera permission after close releases stream, and mobile avatars support keyboard and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockMedia(page, true);
  const buddy = await openBuddy(page);
  await buddy.getByLabel('Your avatar', { exact: true }).focus();
  await expect(buddy.getByRole('img', { name: 'Fictional Indian-presenting interviewer seated at a desk' })).toBeVisible();
  await expect(buddy.getByLabel('Your avatar', { exact: true })).toBeFocused();
  await buddy.getByLabel('Your avatar', { exact: true }).selectOption('🦊');
  await page.keyboard.press('Tab');
  await expect(buddy.getByRole('button', { name: 'Turn camera on' })).toBeFocused();
  await expect(buddy.getByLabel('Your avatar', { exact: true })).toHaveValue('🦊');
  await buddy.getByRole('button', { name: 'Turn camera on' }).click();
  await expect(buddy.getByRole('button', { name: 'Opening camera…' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await buddy.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.screenshot({ path: '/private/tmp/tech-buddy-mobile.png' });
  await buddy.getByRole('button', { name: 'Back to conversation' }).click();
  await page.evaluate(() => window.__finishCamera());
  await expect.poll(() => page.evaluate(() => window.__mediaEvents.includes('camera-stop'))).toBe(true);
});

test('offline demo cycles six local questions without any AI calls or invented scores', async ({ page }) => {
  let aiCalls = 0;
  await page.route(/\/api\/(chat|evaluate)/, route => { aiCalls++; return route.abort(); });
  await page.goto('/tech-buddy-demo');
  const buddy = buddyRegion(page);
  await expect(buddy).toBeVisible();
  await page.context().setOffline(true);
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  const questions = new Set();
  for (let i = 0; i < 6; i++) {
    questions.add(await buddy.getByRole('article', { name: 'Interviewer question' }).textContent());
    await submitAnswer(buddy, 'My offline explanation.');
    await expect(buddy.getByRole('article', { name: 'Tech Buddy feedback' })).toContainText('Not assessed');
    if (i < 5) await buddy.getByRole('button', { name: 'Next Buddy question' }).click();
  }
  await buddy.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(buddy.getByRole('region', { name: 'Tech Buddy session summary' })).toContainText('6 questions completed · 6 attempts · Not assessed');
  expect(questions.size).toBe(6);
  expect(aiCalls).toBe(0);
});

test('ending an in-flight session rejects its late feedback', async ({ page }) => {
  await mockChat(page, 'Explain Java memory visibility.');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/evaluate', async route => { await gate; await route.fulfill({ json: { evaluation } }).catch(() => {}); });
  const buddy = await openBuddy(page);
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await submitAnswer(buddy);
  await expect(buddy.getByRole('button', { name: 'Stop request' })).toBeVisible();
  await buddy.getByRole('button', { name: 'End session', exact: true }).click();
  release();
  await expect(buddy.getByRole('region', { name: 'Tech Buddy session summary' })).toContainText('0 questions completed');
  await expect.poll(async () => (await saved(page)).buddy.phase).toBe('complete');
  expect((await saved(page)).attempts.length).toBe(0);
});

test('Java lesson entry carries its topic into the generated question', async ({ page }) => {
  const requests = await mockChat(page, 'How does the JVM execute bytecode?');
  await gotoSeededApp(page);
  await page.goto('/java/tutorial/jdk-vs-jre-vs-jvm');
  await page.getByRole('link', { name: 'Practice this topic with Tech Buddy' }).click();
  const buddy = buddyRegion(page);
  await expect(buddy).toContainText('Topic: JDK vs JRE vs JVM');
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await expect(buddy.getByRole('article', { name: 'Interviewer question' })).toContainText('bytecode');
  expect(requests[0].messages[0].content).toContain('JDK vs JRE vs JVM');
  await expect.poll(async () => (await saved(page)).buddy?.phase).toBe('question');
  await page.reload();
  await page.getByRole('button', { name: 'Open Tech Buddy', exact: true }).click();
  await expect(buddy.getByRole('article', { name: 'Interviewer question' })).toContainText('bytecode');
});

test('Ask Buddy shares the existing conversation, preserves interview drafts, and does not score questions', async ({ page }) => {
  const requests = await mockChat(page, '**Closures** retain lexical scope.\n\n```js\nconst read = () => value;\n```');
  let evaluations = 0;
  await page.route('**/api/evaluate', route => { evaluations++; return route.fulfill({ json: { evaluation } }); });
  const buddy = await openBuddy(page);
  await expect(buddy.getByLabel('Practice topic', { exact: true })).toHaveValue('React & Next.js');
  await expect(buddy.getByLabel('Session length')).toHaveValue('0');
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await buddy.getByLabel('Your interview answer', { exact: true }).fill('My draft answer');
  await buddy.getByRole('button', { name: 'Give me a hint' }).click();
  await expect(buddy.getByLabel('Your interview answer', { exact: true })).toHaveValue('My draft answer');
  await expect(buddy.getByRole('button', { name: 'Submit answer', exact: true })).toBeEnabled();
  await buddy.getByLabel('Conversation mode').selectOption('ask');
  await buddy.getByLabel('Your question for Buddy').fill('Show a closure example');
  await buddy.getByRole('button', { name: 'Ask Buddy', exact: true }).click();
  await expect(buddy.getByLabel('Your question for Buddy')).toHaveValue('');
  expect(requests.at(-1).interviewMode).toBe('directAnswer');
  expect(requests.at(-1).messages.some(message => message.content.includes('My draft answer'))).toBe(false);
  expect(evaluations).toBe(0);
  await expect(buddy.getByRole('region', { name: 'Buddy conversation' })).toContainText('Show a closure example');
  await buddy.getByLabel('Conversation mode').selectOption('interview');
  await expect(buddy.getByLabel('Your interview answer', { exact: true })).toHaveValue('My draft answer');
  await buddy.getByRole('button', { name: 'Back to conversation' }).click();
  await expect(page.getByRole('log', { name: 'Conversation messages' })).toContainText('Show a closure example');
  await page.reload();
  await page.getByRole('button', { name: 'Open Tech Buddy', exact: true }).click();
  await expect(buddy.getByRole('region', { name: 'Buddy conversation' })).toContainText('Show a closure example');
});

test('custom-length interview generates adaptive follow-ups and ends at the selected count', async ({ page }) => {
  const requests = await mockChat(page, 'Explain a React rendering trade-off.');
  await page.route('**/api/evaluate', route => route.fulfill({ json: { evaluation } }));
  const buddy = await openBuddy(page);
  await buddy.getByLabel('Session length').selectOption('3');
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await submitAnswer(buddy);
  await buddy.getByRole('button', { name: 'Deeper follow-up' }).click();
  await expect(buddy.getByLabel('Your interview answer', { exact: true })).toBeEnabled();
  expect(requests.at(-1).messages.at(-1).content).toContain('deeper follow-up');
  expect(requests.at(-1).messages.at(-1).content).toContain('Define follow-up');
  await submitAnswer(buddy);
  await buddy.getByRole('button', { name: 'Revisit a gap' }).click();
  await expect(buddy.getByLabel('Your interview answer', { exact: true })).toBeEnabled();
  expect(requests.at(-1).messages.at(-1).content).toContain('previously identified gap');
  await submitAnswer(buddy);
  await expect(buddy.getByRole('region', { name: 'Tech Buddy session summary' })).toContainText('3 questions completed');
});

test('unconfigured live avatar falls back and cancelling natural speech rejects late audio', async ({ page }) => {
  await mockChat(page, 'Explain closures.');
  await page.route('**/api/tech-buddy/avatar', route => route.fulfill({ status: 503, json: { error: 'Live interviewer is not configured yet.' } }));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/tech-buddy/speech', async route => { await gate; await route.fulfill({ json: { transcript: 'Late speech', pcm: 'AAA=', wav: 'AAA=' } }).catch(() => {}); });
  const buddy = await openBuddy(page);
  await buddy.getByRole('button', { name: 'Connect live interviewer' }).click();
  await expect(buddy.getByText('Live interviewer is not configured yet.', { exact: true })).toBeVisible();
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await expect(buddy.getByRole('button', { name: 'Stop spoken response' })).toBeVisible();
  await buddy.getByRole('button', { name: 'Stop spoken response' }).click();
  release();
  await expect(buddy.getByRole('button', { name: 'Read question aloud' })).toBeVisible();
  await expect(buddy.getByText('Late speech', { exact: true })).toHaveCount(0);
  await expect(buddy.getByRole('img', { name: 'Fictional Indian-presenting interviewer seated at a desk' })).toBeVisible();
});

test('natural narration speaks a short explanation while code remains readable, then releases audio', async ({ page }) => {
  await mockMedia(page);
  await page.addInitScript(() => {
    window.Audio = class {
      constructor(src) { this.src = src; window.__buddyAudio = this; }
      play() { this.onplaying?.(); return Promise.resolve(); }
      pause() { window.__mediaEvents.push('audio-paused'); }
      removeAttribute() {}
      load() {}
    };
  });
  await mockChat(page, '**Explanation:** A closure retains lexical scope.\n\n```js\nconst read = () => value;\n```');
  let speechRequest;
  await page.route('**/api/tech-buddy/speech', route => {
    speechRequest = route.request().postDataJSON();
    return route.fulfill({ json: { transcript: 'A closure keeps access to its scope. The code is on screen.', pcm: 'AAA=', wav: 'AAA=' } });
  });
  const buddy = await openBuddy(page);
  await buddy.getByLabel('Conversation mode').selectOption('ask');
  await buddy.getByLabel('Your question for Buddy').fill('Explain closures with code');
  await buddy.getByRole('button', { name: 'Ask Buddy', exact: true }).click();
  await buddy.getByRole('button', { name: 'Speak concise explanation', exact: true }).click();
  await expect(buddy.getByText('Speaking', { exact: true })).toBeVisible();
  expect(speechRequest.concise).toBe(true);
  expect(speechRequest.text).toContain('const read');
  await expect(buddy.getByRole('region', { name: 'Buddy conversation' })).toContainText('const read');
  await buddy.getByRole('button', { name: 'Speak question', exact: true }).click();
  expect(await page.evaluate(() => window.__mediaEvents)).toContain('audio-paused');
  await expect(buddy.getByRole('button', { name: 'Stop spoken response' })).toHaveCount(0);
  await buddy.getByRole('button', { name: 'End session', exact: true }).click();
});

test('a Buddy answer can be finished in the regular composer without losing its session progress', async ({ page }) => {
  await mockChat(page, 'Explain closures.');
  await page.route('**/api/evaluate', route => {
    expect(route.request().postDataJSON().question).toBe('Explain closures.');
    return route.fulfill({ json: { evaluation } });
  });
  const buddy = await openBuddy(page);
  await buddy.getByRole('button', { name: 'Start Buddy interview' }).click();
  await buddy.getByLabel('Your interview answer', { exact: true }).fill('A closure keeps its lexical scope.');
  await buddy.getByRole('button', { name: 'Back to conversation' }).click();
  await expect(page.getByRole('textbox', { name: 'Message composer' })).toHaveValue('A closure keeps its lexical scope.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(async () => (await saved(page)).buddy.phase).toBe('review');
  await page.getByRole('button', { name: 'Open Tech Buddy', exact: true }).click();
  await expect(buddy.getByRole('article', { name: 'Tech Buddy feedback' })).toContainText('8/10');
  expect((await saved(page)).attempts.length).toBe(1);
});
