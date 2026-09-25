import { test, expect } from '@playwright/test';
test('existing-product edits and deletions persist and update filtered totals', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill('emilys');
  await page.getByLabel('Password', { exact: true }).fill('emilyspass');
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.goto('/products/1');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Category')).toHaveValue('beauty');
  await page.getByRole('dialog').getByLabel('Product name').fill('Edited mascara');
  await page.getByRole('dialog').getByLabel('Category').selectOption('fragrances');
  await page.getByLabel('Price (INR)').fill('7.50');
  const update = page.waitForResponse(
    (r) => r.url().endsWith('/api/products/1') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  expect((await update).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Edited mascara', exact: true })).toBeVisible();
  await page.goto('/products?category=beauty');
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await expect(page.locator('tbody')).not.toContainText('Edited mascara');
  await page.goto('/products?category=fragrances&sort=price-asc');
  await expect(page.locator('tbody tr').first()).toContainText('Edited mascara');
  await page.reload();
  await expect(page.locator('tbody tr').first()).toContainText('₹7.50');
  await page.getByRole('button', { name: 'Delete Edited mascara', exact: true }).click();
  const deletion = page.waitForResponse(
    (r) => r.url().endsWith('/api/products/1') && r.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Delete product', exact: true }).click();
  expect((await deletion).status()).toBe(200);
  await expect(page.locator('tbody')).not.toContainText('Edited mascara');
  await page.reload();
  await expect(page.locator('.pagination-summary')).toContainText('of 5');
  await page.goto('/products/1');
  await expect(page.getByRole('heading', { name: 'This product is off the shelf.' })).toBeVisible();
});
