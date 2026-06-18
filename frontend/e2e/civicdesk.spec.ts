import { test, expect, Page } from '@playwright/test';

/** Fails the test on any console.error or uncaught page error — Angular template/pipe bugs surface here. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  const IGNORE = [/favicon/i, /ERR_INTERNET_DISCONNECTED/i, /Failed to load resource.*404.*favicon/i];
  page.on('console', msg => {
    if (msg.type() === 'error' && !IGNORE.some(re => re.test(msg.text()))) errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

const PDF = Buffer.from('%PDF-1.4 e2e test document\n%%EOF');

test('citizen can file, upload, submit and track an application', async ({ page }) => {
  const errors = watchConsole(page);

  await login(page, 'citizen@civicdesk.gov', 'Citizen123!');
  await expect(page).toHaveURL(/\/applications/);

  // dismiss the first-visit guide if it shows
  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();

  // browse the catalog and start a pet registration
  await page.getByRole('link', { name: 'Services' }).first().click();
  await expect(page.getByRole('heading', { name: /need to get done/i })).toBeVisible();
  await page.getByRole('button', { name: /Pet registration/ }).click();
  await expect(page).toHaveURL(/\/services\/pet-registration\/apply/);

  // step 1 — details
  await page.getByLabel('Pet name').fill('Milo');
  await page.getByLabel('Species').selectOption('dog');
  await page.locator('input[type=checkbox]').first().check();
  await page.getByRole('button', { name: /Save & continue/ }).click();

  // step 2 — documents
  await expect(page.getByText(/Step|Documents/).first()).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'id.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(page.getByText('Verified').first()).toBeVisible();
  await page.locator('input[type=file]').nth(1).setInputFiles({ name: 'vax.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // step 3 — review + submit
  await page.getByRole('button', { name: /Submit application/ }).click();
  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]+/);
  await expect(page.getByText('Status timeline')).toBeVisible();
  await expect(page.getByText('Received').first()).toBeVisible();

  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('officer can take a queued case and approve it', async ({ page }) => {
  const errors = watchConsole(page);

  await login(page, 'officer@civicdesk.gov', 'Officer123!');
  await expect(page).toHaveURL(/\/officer/);

  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();

  // filter to the submitted queue and open the first case
  await page.getByText('Received', { exact: true }).first().click();
  await page.locator('tbody tr').first().click();
  await expect(page).toHaveURL(/\/officer\/[0-9a-f-]+/);

  // take it, then approve
  await page.getByRole('button', { name: /Take this case/ }).click();
  await expect(page.getByText('Under review').first()).toBeVisible();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Approved').first()).toBeVisible();

  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('language toggle and about page render bilingually', async ({ page }) => {
  const errors = watchConsole(page);

  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'CivicDesk' })).toBeVisible();
  await expect(page.getByText('Design patterns')).toBeVisible();

  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(page.getByText('Patrones de diseño')).toBeVisible();

  expect(errors, errors.join('\n')).toHaveLength(0);
});
