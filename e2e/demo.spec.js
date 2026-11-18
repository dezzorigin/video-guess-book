// Demo script (bukan test gate): menjalankan alur tamu penuh dengan kamera
// palsu sambil merekam video + mengambil screenshot tiap layar untuk
// README dan docs/demo/. Dijalankan lokal via:
//   npm run build && npx playwright test e2e/demo.spec.js --project=chromium
// Video mentah (.webm) lalu dikonversi ke docs/demo/demo.mp4 dengan ffmpeg.
// Screenshot: docs/screenshots/01..08.
import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

test('demo: alur tamu penuh + screenshot tiap layar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  // 01 — sambutan
  await expect(page.getByRole('button', { name: 'Sentuh untuk Mulai' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/01-welcome.png' });

  // 02 — landing
  await page.goto('/#landing');
  await expect(page.getByText('Ucapan pernikahan, direkam langsung di lokasi.')).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/02-landing-hero.png' });
  await page.evaluate(() => document.querySelector('#fitur')?.scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/screenshots/03-landing-features.png' });
  await page.goto('/');

  // 03 — nama tamu
  await page.getByRole('button', { name: 'Sentuh untuk Mulai' }).click();
  await page.getByLabel('Nama tamu').fill('Tamu Demo');
  await page.screenshot({ path: 'docs/screenshots/04-guest-name.png' });
  await page.getByRole('button', { name: 'Lanjutkan' }).click();

  // 04 — hitung mundur
  await expect(page.getByText('Siapkan senyum terbaikmu')).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/05-greeting.png' });

  // 05 — rekam (kamera palsu)
  await expect(page.locator('#screen-recording')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: 'docs/screenshots/06-recording.png' });
  await page.getByRole('button', { name: 'Selesai & Simpan Video' }).click();

  // 06 — pratinjau
  await expect(page.getByText('Tinjau rekaman Anda')).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: 'docs/screenshots/07-preview.png' });
  await page.getByRole('button', { name: 'Simpan Ucapan' }).click();

  // 07 — terima kasih
  await expect(page.getByText('Terima kasih!')).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: 'docs/screenshots/08-thankyou.png' });
  await page.waitForTimeout(500);

  // 08 — dashboard operator (PIN default 1234)
  await page.getByRole('button', { name: 'Buka Pengaturan Operator' }).click();
  await page.getByPlaceholder('PIN').fill('1234');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByText('Rekaman Terbaru')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screenshots/09-operator-dashboard.png' });
});
