# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Catatan: entri sebelum 2026-11-19 di bawah ini ditulis ulang pada
> 2026-11-19 karena isi CHANGELOG lama tidak cocok dengan isi repo
> (menyebut Next.js, leaderboard, dan "game tebak video" yang tidak pernah
> ada di repo ini). Yang benar: aplikasi ini sejak awal adalah **OpenWedding**,
> kiosk video guestbook Vite + React + PWA.

## [Unreleased]

### Added
- Landing page ala SaaS di `#landing`: navbar + logo GitHub (tautan ke repo),
  hero + pratinjau produk, 6 fitur, cara kerja 4 langkah, footer.
- Tautan "Tentang OpenWedding" di layar sambutan kiosk.
- CI (`.github/workflows/ci.yml`): build Vite + cek bundle, advisory sweep
  OSV batch, audit PWA Node kustom, Playwright e2e dengan kamera/mik palsu.
- Playwright smoke test: alur tamu penuh (nama → rekam → pratinjau → simpan
  → terima kasih, terverifikasi tersimpan di IndexedDB), PIN operator
  (salah ditolak / benar membuka dashboard), manifest + service worker.
- Skrip demo e2e (`e2e/demo.spec.js`): screenshot tiap layar +
  video demo alur tamu penuh.
- `scripts/pwa-audit.mjs`: audit manifest + service worker + ikon hasil build.
- `scripts/advisory-sweep.py`: sweep OSV batch (tanpa auth) untuk dependensi produksi.
- Docs lengkap: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/USER-GUIDE.md`,
  `docs/DEPLOYMENT.md`, `docs/DEMO.md`, `docs/DIAGRAMS.html` (HTML+SVG).
- Screenshot asli + video demo di `docs/screenshots/` dan `docs/demo/`.
- README standar repo top (penjelasan, cara jalan, screenshot + video demo).

### Fixed
- **Manifest PWA tertimpa saat build**: tanpa opsi `manifest`, vite-plugin-pwa
  menimpa `public/manifest.webmanifest` dengan manifest minimal hasil generate
  (nama "openwedding", tanpa ikon, `lang: en`). Manifest kini dideklarasikan
  eksplisit di `vite.config.js` (cerminan `public/manifest.webmanifest`):
  nama OpenWedding, ikon 192/512 + maskable, `lang: id`.
- URL kanonis/OG/sitemap/robots diperbarui dari `openwedding.pages.dev`
  ke `video-guess-book.pages.dev` (nama proyek Pages final).

### Removed
- Cache Wrangler lokal yang ter-commit (`.wrangler/cache/` berisi Cloudflare
  account id + nama akun) dihapus dari tree; `.wrangler/` masuk `.gitignore`.
- Duplikat font di root (`fonts/`, tidak pernah dipakai — yang dipakai
  `public/fonts/` via `@import '/fonts/fonts.css'`) dihapus dari tree.
- `DESIGN.md` lama (isinya desain landing Regesit, tidak ada hubungan dengan
  repo ini) diganti desain OpenWedding yang benar.

### Changed
- `.gitignore` diperkuat: `.wrangler/`, `test-results/`, `playwright-report/`,
  `.env*` (dengan pengecualian `.env.example`).
- `package.json`: skrip `test:e2e` + `pwa:audit`; deploy memakai proyek
  Pages `video-guess-book`; devDependency `@playwright/test`.

## [1.0.0] - 2026

### Added
- Kiosk video guestbook OpenWedding (Vite + React 19 + PWA): alur tamu
  4 langkah (nama → hitung mundur → rekam → pratinjau & simpan), IndexedDB
  multi-event, 5 tema pastel, dashboard operator ber-PIN, export ZIP + CSV + TXT.
- PWA: manifest, ikon, service worker Workbox (precache).
- Font self-hosted (Outfit + Playfair Display), ikon, gambar pratinjau.
- README + PRD + LICENSE MIT (versi awal, template).
