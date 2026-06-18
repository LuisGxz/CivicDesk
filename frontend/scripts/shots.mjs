// Captures CivicDesk screens at 3 breakpoints (390 / 768 / 1280) for the delivery quality gate.
// Usage: node scripts/shots.mjs   (API on :5280 + SPA on :4200 must be running)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4200';
const OUT = 'docs/screenshots';
const WIDTHS = [390, 768, 1280];
mkdirSync(OUT, { recursive: true });

async function loginAs(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForLoadState('networkidle');
  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();
}

async function shoot(context, name, path, setup) {
  for (const w of WIDTHS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: w, height: 900 });
    if (setup) await setup(page);
    else { await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }); }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true });
    await page.close();
    console.log(`✓ ${name}-${w}.png`);
  }
}

const browser = await chromium.launch();

// Public screens
let ctx = await browser.newContext({ locale: 'en-US' });
await shoot(ctx, 'catalog', '/services');
await shoot(ctx, 'login', '/login');
await shoot(ctx, 'about', '/about');
await ctx.close();

// Citizen screens
ctx = await browser.newContext({ locale: 'en-US' });
let page = await ctx.newPage();
await loginAs(page, 'citizen@civicdesk.gov', 'Citizen123!');
await page.close();
await shoot(ctx, 'tracker', '/applications');
// open the approved application for a rich timeline shot
{
  const p = await ctx.newPage();
  await p.goto(`${BASE}/applications`, { waitUntil: 'networkidle' });
  await p.getByText('Approved').first().click().catch(() => {});
  await p.waitForLoadState('networkidle');
  const url = p.url().replace(BASE, '');
  await p.close();
  await shoot(ctx, 'application-detail', url);
}
await ctx.close();

// Officer screens
ctx = await browser.newContext({ locale: 'en-US' });
page = await ctx.newPage();
await loginAs(page, 'officer@civicdesk.gov', 'Officer123!');
await page.close();
await shoot(ctx, 'officer-inbox', '/officer');
{
  const p = await ctx.newPage();
  await p.goto(`${BASE}/officer`, { waitUntil: 'networkidle' });
  await p.locator('tbody tr').first().click();
  await p.waitForLoadState('networkidle');
  const url = p.url().replace(BASE, '');
  await p.close();
  await shoot(ctx, 'officer-detail', url);
}
await ctx.close();

await browser.close();
console.log('done');
