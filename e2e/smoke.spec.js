// Smoke test end-to-end OpenWedding di atas build production (vite preview).
// Kamera/mik palsu dari playwright.config.js — tanpa perangkat keras.
//
// Alur yang diuji:
//   1. Layar sambutan tampil (nama mempelai default + tombol mulai).
//   2. Landing #landing: navbar + tautan GitHub + hero + fitur + footer;
//      tombol "Buka Kiosk" kembali ke kiosk.
//   3. Alur tamu penuh: nama -> hitung mundur -> rekam (kamera palsu) ->
//      stop -> pratinjau -> simpan ke IndexedDB -> terima kasih.
//   4. PIN salah ditolak; PIN benar (1234) membuka EO Control Center.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sentuh untuk Mulai' })).toBeVisible();
});

test('landing #landing: navbar + GitHub + hero + fitur + footer', async ({ page }) => {
  await page.goto('/#landing');
  await expect(page.getByRole('link', { name: 'Lihat kode sumber di GitHub' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lihat kode sumber di GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/dezzorigin/video-guess-book',
  );
  await expect(page.getByText('Ucapan pernikahan, direkam langsung di lokasi.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Offline-first' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Export ZIP' })).toBeVisible();
  await expect(page.getByText('Cara kerja — 4 langkah tamu')).toBeVisible();
  await expect(page.getByText('Lisensi MIT — dibuat oleh dezzorigin')).toBeVisible();

  await page.getByRole('button', { name: 'Buka Kiosk' }).first().click();
  await expect(page.getByRole('button', { name: 'Sentuh untuk Mulai' })).toBeVisible();
});

test('alur tamu penuh: nama -> rekam -> pratinjau -> simpan -> terima kasih', async ({ page }) => {
  // 1. Sambutan -> nama tamu
  await page.getByRole('button', { name: 'Sentuh untuk Mulai' }).click();
  await expect(page.getByLabel('Nama tamu')).toBeVisible();
  await page.getByLabel('Nama tamu').fill('Tamu Uji');
  await page.getByRole('button', { name: 'Lanjutkan' }).click();

  // 2. Hitung mundur 3 detik -> layar rekam otomatis
  await expect(page.getByText('Siapkan senyum terbaikmu')).toBeVisible();
  await expect(page.locator('#screen-recording')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#webcam-preview')).toBeVisible();
  await expect(page.getByText('REC')).toBeVisible();

  // 3. Rekam ~3 detik (tombol stop aktif setelah 2 detik), lalu stop
  await page.waitForTimeout(3_000);
  await page.getByRole('button', { name: 'Selesai & Simpan Video' }).click();

  // 4. Pratinjau -> simpan ke IndexedDB -> terima kasih
  await expect(page.getByText('Tinjau rekaman Anda')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#recorded-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Simpan Ucapan' }).click();
  await expect(page.getByText('Terima kasih!')).toBeVisible({ timeout: 10_000 });

  // 5. Video benar-benar tersimpan di IndexedDB (bukan cuma pindah layar)
  const saved = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open('OpenWeddingDB', 2);
        req.onsuccess = () => {
          const tx = req.result.transaction('videos', 'readonly');
          const getAll = tx.objectStore('videos').getAll();
          getAll.onsuccess = () =>
            resolve((getAll.result || []).map((v) => ({ guest: v.guestName, sizeMB: v.sizeMB })));
          getAll.onerror = () => resolve([]);
        };
        req.onerror = () => resolve([]);
      }),
  );
  expect(saved.length).toBeGreaterThanOrEqual(1);
  expect(saved[0].guest).toBe('Tamu Uji');
});

test('tamu bisa lewati nama (anonim)', async ({ page }) => {
  await page.getByRole('button', { name: 'Sentuh untuk Mulai' }).click();
  await page.getByRole('button', { name: 'Lewati' }).click();
  await expect(page.getByText('Siapkan senyum terbaikmu')).toBeVisible();
});

test('PIN operator: salah ditolak, benar membuka dashboard', async ({ page }) => {
  // Buka modal PIN lewat tombol gerigi di topbar kiosk
  await page.getByRole('button', { name: 'Buka Pengaturan Operator' }).click();
  await expect(page.getByText('Akses Operator')).toBeVisible();

  await page.getByPlaceholder('PIN').fill('0000');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByText('PIN salah. Coba lagi.')).toBeVisible();

  await page.getByPlaceholder('PIN').fill('1234');
  await page.getByRole('button', { name: 'Masuk' }).click();
  // "EO Control Center" hanya disebut di teks modal PIN — dashboard sendiri
  // dikenali dari tab Galeri + kartu Rekaman Terbaru.
  await expect(page.getByText('Rekaman Terbaru')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: 'Galeri' })).toBeVisible();
});

test('ganti PIN operator: PIN lama mati, PIN baru berlaku', async ({ page }) => {
  // Masuk dashboard dengan PIN default
  await page.getByRole('button', { name: 'Buka Pengaturan Operator' }).click();
  await page.getByPlaceholder('PIN').fill('1234');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByText('Rekaman Terbaru')).toBeVisible({ timeout: 10_000 });

  // Ganti PIN di kartu Keamanan (tab Overview)
  await expect(page.getByText('Keamanan — Ganti PIN Operator')).toBeVisible();
  await page.getByLabel('PIN baru', { exact: true }).fill('5678');
  await page.getByLabel('Konfirmasi PIN baru', { exact: true }).fill('5678');
  await page.getByRole('button', { name: 'Simpan PIN Baru' }).click();
  await expect(page.locator('#operator-dashboard-modal').getByText('PIN operator berhasil diganti.')).toBeVisible();

  // Tutup dashboard, buka lagi: PIN lama ditolak, PIN baru diterima
  await page.getByRole('button', { name: 'Tutup Dashboard' }).click().catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  await page.getByRole('button', { name: 'Buka Pengaturan Operator' }).click();
  await page.getByPlaceholder('PIN').fill('1234');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByText('PIN salah. Coba lagi.')).toBeVisible();
  await page.getByPlaceholder('PIN').fill('5678');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByText('Rekaman Terbaru')).toBeVisible({ timeout: 10_000 });
});

test('PWA: manifest tersaji + service worker terdaftar', async ({ page }) => {
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const body = await manifest.json();
  expect(body.name).toBe('OpenWedding');
  expect(body.display).toBe('standalone');

  const swScope = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'no-sw-api';
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return reg.scope;
      await new Promise((r) => setTimeout(r, 250));
    }
    return 'none';
  });
  expect(swScope).not.toBe('none');
});
