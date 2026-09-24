import { test, expect, type Page } from '@playwright/test';
async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Fill in demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole('table')).toBeVisible();
}
test('unauthenticated pages and APIs are protected; login errors and secure session', async ({
  page,
  request,
}) => {
  expect((await request.get('/api/products')).status()).toBe(401);
  await page.goto('/products/1');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Username', { exact: true }).fill('emilys');
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('Incorrect');
  await page.getByLabel('Password', { exact: true }).fill('emilyspass');
  let count = 0;
  page.on('request', (r) => {
    if (r.url().includes('/api/auth/login')) count++;
  });
  await page.getByRole('button', { name: 'Sign in to workspace' }).dblclick();
  await expect(page).toHaveURL(/\/products$/);
  expect(count).toBe(1);
  const cookie = (await page.context().cookies()).find((c) => c.name === 'folio_session');
  expect(cookie?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('folio_session');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login/);
});
test('pagination, URL repair, filters, sorting, empty state and stale searches', async ({
  page,
}) => {
  await signIn(page);
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.pagination-summary')).toContainText('11–20');
  await page.getByLabel('Rows per page').selectOption('20');
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await expect(page).not.toHaveURL(/page=2/);
  await page.getByLabel('Filter by category').selectOption('beauty');
  await expect(page).toHaveURL(/category=beauty/);
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await expect(page.locator('tbody .category-tag').first()).toHaveText('Beauty');
  await page.getByLabel('Sort products', { exact: true }).selectOption('price-desc');
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.locator('tbody tr').first()).toBeVisible();
  const prices = await page.locator('.price-cell').allTextContents();
  const nums = prices.map((p) => Number(p.replace(/[^\d.]/g, '')));
  expect(nums).toEqual([...nums].sort((a, b) => b - a));
  await page.getByLabel('Search products', { exact: true }).fill('nonexistent-zzzzzz');
  await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
  await expect(page.getByLabel('Filter by category')).toHaveValue('');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).last().click();
  await page.goto('/products?page=abc&size=bad&sort=bad');
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.goto('/products?page=999');
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await expect(page).not.toHaveURL(/page=999/);
  await page.goto('/products?delay=2000');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await page.getByLabel('Search products', { exact: true }).fill('phone');
  await page.waitForTimeout(500);
  await page.getByLabel('Search products', { exact: true }).fill('lipstick');
  await expect(page).toHaveURL(/q=lipstick/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Lipstick');
  await page.waitForTimeout(2300);
  await expect(page.locator('tbody')).toContainText('Lipstick');
  await page.reload();
  await expect(page.getByLabel('Search products', { exact: true })).toHaveValue('lipstick');
});
test('add, validate, edit, persist, cancel delete and delete', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByText('Enter at least 2 characters.')).toBeVisible();
  await page.getByLabel('Product name').fill('Test ceramic cup');
  await page.getByLabel('Description').fill('A handmade ceramic cup for testing.');
  await page.getByRole('dialog').getByLabel('Category').selectOption('home-decoration');
  await page.getByLabel('Price (USD)').fill('25.50');
  await page.getByLabel('Stock quantity').fill('8');
  let creates = 0;
  page.on('request', (r) => {
    if (r.url().includes('/products/add')) creates++;
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add product', exact: true })
    .dblclick();
  await expect(page.getByRole('heading', { name: 'Test ceramic cup', exact: true })).toBeVisible();
  expect(creates).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Test ceramic cup', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.getByLabel('Product name').fill('Updated ceramic cup');
  await page.getByLabel('Price (USD)').fill('31.25');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Updated ceramic cup', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.detail-price')).toContainText('$31.25');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Keep product', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Updated ceramic cup', exact: true }),
  ).toBeVisible();
  const detail = page.url();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete product', exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.goto(detail);
  await expect(page.getByRole('heading', { name: 'This product is off the shelf.' })).toBeVisible();
});
test('detail images, reviews, missing product and mobile layout', async ({ page }) => {
  await signIn(page);
  await page.goto('/products/1');
  await expect(page.getByRole('heading', { name: 'Product details.' })).toBeVisible();
  await expect(page.locator('.description')).toBeVisible();
  await expect(page.locator('.review')).toHaveCount(3);
  await expect(page.locator('.gallery-stage img')).toBeVisible();
  await page.goto('/products/999999');
  await expect(page.getByRole('heading', { name: 'This product is off the shelf.' })).toBeVisible();
  await page.goto('/products/not-an-id');
  await expect(page.getByRole('heading', { name: 'This product is off the shelf.' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/products');
  await expect(page.locator('.product-card')).toHaveCount(10);
  await expect(page.locator('.desktop-products')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation' }).last().click();
  await page.screenshot({ path: 'artifacts/mobile-catalog.png', fullPage: true });
});
test('API error can be retried and expired token is rejected', async ({ page }) => {
  await signIn(page);
  await page.route('**/api/products?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Service temporarily unavailable' }),
    }),
  );
  await page.reload();
  await expect(page.getByRole('heading', { name: 'We couldn’t load this' })).toBeVisible();
  await page.unroute('**/api/products?*');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.context().addCookies([
    {
      name: 'folio_session',
      value: 'invalid-token',
      domain: new URL(page.url()).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login/);
});
