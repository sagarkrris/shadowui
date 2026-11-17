import { test, expect } from '@playwright/test';
import { contentInventory } from '../lib/contentInventory.mjs';
let counts;
test.beforeAll(async () => { ({ counts } = await contentInventory()); });

test('home links to diagnostic, evidence and honest capability requirements', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Find a starting point with the diagnostic' })).toHaveAttribute('href', '/diagnostic');
  await expect(page.getByRole('link', { name: 'Review your learning evidence', exact: true })).toHaveAttribute('href', '/progress');
  await page.getByRole('link', { name: 'Access requirements and content inventory' }).click();
  await expect(page.getByRole('heading', { name: 'What you can use, and what it needs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account cloud sync', exact: true })).toBeVisible();
  await expect(page.getByText(`${counts.courses} structured courses`, { exact: true })).toBeVisible();
  await expect(page.getByText(`${counts.challenges} java build challenges`, { exact: true })).toBeVisible();
  await expect(page.getByText(`${counts.codingProblems} coding problems`, { exact: true })).toBeVisible();
});

test('editorial deep link finds actual article provenance without an invented review', async ({ page }) => {
  await page.goto('/editorial?article=%2Ftech-blogs%2Frequest-timed-out-did-payment-happen#article-provenance');
  await expect(page.getByRole('searchbox', { name: 'Find article provenance' })).toHaveValue('/tech-blogs/request-timed-out-did-payment-happen');
  await expect(page.getByRole('status')).toHaveText('1 matching articles');
  await page.getByText('The request timed out. Did the payment happen?', { exact: true }).click();
  await expect(page.getByText('Source registry: lib/backendFieldNotes.mjs')).toBeVisible();
  await expect(page.getByText(/Named independent review not recorded/)).toBeVisible();
  await expect(page.getByText(/Content revision: sha256:/)).toBeVisible();
  await page.getByRole('searchbox', { name: 'Find article provenance' }).fill('no-such-article-123');
  await expect(page.getByText('No matching article.', { exact: false })).toBeVisible();
});
