import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

test('canvas loads and basic flows work', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // React Flow canvas present
  await expect(page.locator('.react-flow__renderer')).toBeVisible();

  // Toolbar or page-frame control present (adjust label to your UI)
  const pageFrameBtn = page.getByRole('button', { name: /page frame/i });
  if (await pageFrameBtn.isVisible()) {
    await pageFrameBtn.click();
  }

  // Try exporting PNG through an Export menu if present
  const exportBtn = page.getByRole('button', { name: /export/i });
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    const pngBtn = page.getByRole('button', { name: /png/i });
    if (await pngBtn.isVisible()) {
      await pngBtn.click();
    }
  }

  // Basic smoke: no unhandled error banners
  await expect(page.locator('[data-testid="error"]')).toHaveCount(0);
});
