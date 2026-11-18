import { defineConfig, devices } from '@playwright/test';

// Kamera/mik palsu: Chromium menyediakan fake video (pola hijau bergerak)
// + fake audio, dan --use-fake-ui-for-media-stream mengklik izin media
// secara otomatis — alur rekam bisa diuji end-to-end tanpa perangkat.
const FAKE_MEDIA_ARGS = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    launchOptions: { args: FAKE_MEDIA_ARGS },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
