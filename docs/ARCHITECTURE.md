# Arsitektur — OpenWedding

> SPA React tanpa router dan tanpa backend. Semua state di browser;
> semua data di perangkat. Diagram visual: [DIAGRAMS.html](DIAGRAMS.html).

## 1. Gambaran sistem

```
Tamu / Operator
      │  (sentuh, ketik, rekam)
      ▼
┌─────────────────────────────── Browser (Chrome/Edge) ───────────────────────────────┐
│  index.html ──▶ React 19 (src/main.jsx → App.jsx)                                    │
│    │                                                                                 │
│    ├─ KioskContext (state pusat) ──▶ layar, config, event aktif, sesi tamu, toast   │
│    ├─ Screens: Welcome, GuestName, Greeting, Recording, Preview, ThankYou, Landing  │
│    ├─ Modals: PinModal, OperatorDashboard, ExportModal, ConfirmModal                │
│    └─ Services: storage (IndexedDB), media (getUserMedia/MediaRecorder), export (ZIP)│
│                                                                                       │
│  Service worker (Workbox generateSW, precache 49 entri) ◀── vite-plugin-pwa         │
│  IndexedDB OpenWeddingDB v2  +  localStorage config                                  │
└───────────────────────────────────────────────────────────────────────────────────────┘
Tidak ada server, API, atau database eksternal. Tidak ada upload.
```

## 2. Stack

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Build | Vite 5.4 | `vite build` → `dist/` |
| UI | React 19 + JSX | Tanpa TypeScript, tanpa router |
| Ikon | lucide-react 1.44 | Tanpa ikon brand (lihat DESIGN.md) |
| PWA | vite-plugin-pwa 0.20 | `generateSW`, `registerType: autoUpdate`, `injectRegister: script-defer` |
| Rekam | MediaRecorder API | `detectBestMimeType()`: MP4 → WebM |
| Audio | Web Audio API | Analyser → visual mic 5 bar |
| Export | JSZip 3.10 | ZIP + CSV + TXT |
| Data | IndexedDB + localStorage | Lihat §4 |
| Test | Playwright 1.65 | Kamera/mik palsu |
| Deploy | Cloudflare Pages | Proyek `video-guess-book` (direct upload) |

## 3. Routing & state layar

Tidak ada react-router. Dua mekanisme:

1. **State `currentScreen`** di `KioskContext`: `welcome` → `guest-name` →
   `greeting` → `recording` → `preview` → `thankyou` → `welcome`.
   Layar `recording` dirender frameless (tanpa frame/topbar kiosk).
2. **Hash URL**: `#landing` menampilkan `ScreenLanding` (menggantikan
   seluruh kiosk); `#admin` / `#operator` membuka modal PIN. `hashchange`
   didengarkan di `App.jsx`.

State sesi tamu (`session`): `guestName`, `recordedBlob`, `recordedUrl`
(object URL), `mimeType`, `recordedChunks`. `resetSession()` mencabut
object URL lama.

## 4. Penyimpanan

### IndexedDB — `OpenWeddingDB`, versi 2

| Store | Key | Isi |
|---|---|---|
| `videos` | `id` (`vid_<ts>_<rand>`) | `eventId`, `filename`, `guestName`, `eventTitle`, `timestamp`, `rawDate`, `blob` (video), `sizeMB`; index `eventId` |
| `events` | `id` (`evt_<ts>`) | `groomName`, `brideName`, `title`, `subtitle`, `theme`, `recordSeconds`, `createdAt`, `status` (`active`/`completed`) |

### localStorage

| Key | Isi |
|---|---|
| `openwedding_kiosk_config` | `coupleNames`, `eventDateLine`, `recordSeconds` (default 60), `theme` (default `gold`), `operatorPin` (default `1234`) |
| `openwedding_active_event_id` | id event aktif |

Aplikasi meminta **storage persistence** (`navigator.storage.persist()`)
saat modul storage dimuat; dashboard menampilkan status persistensi +
estimasi kuota (`navigator.storage.estimate()`).

### Alur simpan video

```
rekam (MediaRecorder, ondataavailable tiap 500 ms)
  → onstop: Blob dari chunks → object URL → session
  → pratinjau: pengguna menekan "Simpan Ucapan"
  → storageService.saveVideoBlob(): nama file
    "<Mempelai>_<Tamu>_<ISO-timestamp>.mp4"
    (blob non-MP4 dibungkus ulang sebagai video/mp4)
  → IndexedDB videos.add() → toast sukses → layar terima kasih
```

## 5. Media & perekaman

`services/media.js`:

- `detectBestMimeType()` — urutan: `video/mp4;codecs=avc1…` → `video/mp4`
  → `video/webm;codecs=vp9,opus` → `vp8` → `h264` → `webm`.
- `requestMediaStream(cameraId, micId)` — `getUserMedia` 1280×720 ideal,
  `facingMode: user`; deviceId exact bila dipilih operator.
- `startAudioVisualizer(stream, cb)` — AnalyserNode → 5 bar mic.
- Stream disimpan di context (`mediaStream`) agar tidak minta izin ulang
  antar layar; `ScreenRecording` memakai ulang bila masih aktif.

`ScreenRecording`: mulai merekam saat mount (guard `isStartedRef` untuk
StrictMode double-mount), timer 500 ms, tombol stop aktif setelah 2 detik,
auto-stop saat `recordSeconds` tercapai. `ScreenPreview` memutar
`session.recordedUrl` di `<video controls>`.

## 6. Operator dashboard

`OperatorDashboard.jsx` (1423 baris) — modal penuh, 4 tab:

| Tab | Isi |
|---|---|
| Overview | Statistik (jumlah video, total MB, sisa storage), peringatan (storage menipis / belum persistent), ringkasan event aktif |
| Galeri | Daftar video (filter: event aktif / semua / per event), putar, hapus per video, hapus per event |
| Events | Buat event baru, ganti event aktif, edit event aktif (nama, subtitle, tema via dot-picker, durasi) |
| Hardware | Pilih kamera & mikrofon (enumerateDevices), tes mic langsung |

Akses dijaga `PinModal` (PIN dari config, default `1234`). Pintasan buka:
ikon gerigi di topbar, ketuk 5× nama mempelai di layar sambutan, `#admin`.

## 7. Export

`services/exportService.js`:

- `buildEventZip(videos, eventName, eventDate, onProgress)` — JSZip:
  folder `<Event>_Videos/` berisi tiap video + `Daftar_Tamu.csv` +
  `Rekap.txt`; progress callback untuk `ExportModal`.
- `generateGuestListCSV` — kolom No, Nama Tamu, Waktu Rekam, Ukuran (MB),
  Nama File, ID Event.
- `generateGuestListTXT` — rekap teks berbahasa Indonesia.
- `downloadBlob(blob, filename)` — unduh via `<a download>`.

## 8. PWA & offline

- `vite.config.js` → `VitePWA({ registerType: 'autoUpdate',
  injectRegister: 'script-defer', devOptions: { enabled: false } })`.
- **Manifest dideklarasikan eksplisit di `vite.config.js`** (cerminan
  `public/manifest.webmanifest`). Alasan: tanpa opsi ini, plugin menimpa
  manifest public dengan manifest minimal hasil generate (nama
  "openwedding", tanpa ikon) — bug yang ditemukan & diperbaiki 2026-11-19.
- Workbox `generateSW`: precache 49 entri (~3,2 MB: JS/CSS/font/gambar/
  ikon); `globPatterns: **/*.{js,css,html,ico,png,svg,woff,woff2}`.
- Service worker **hanya aktif dari hasil build** (`npm run preview` /
  Pages), tidak di `npm run dev`.
- Font self-hosted (`public/fonts/`, Outfit + Playfair Display) ikut
  ter-precache. Satu-satunya dependensi online adalah `@import` Google
  Fonts di `styles.css` (pelengkap; tidak memblokir render offline).

## 9. Keamanan

- Tanpa backend = tanpa permukaan serangan server. Ancaman utama adalah
  perangkat fisik (tamu membuka dashboard) → dimitigasi PIN + konfirmasi
  hapus + tidak ada rute yang mengekspos galeri tanpa PIN.
- PIN disimpan plaintext di localStorage — **bukan autentikasi kuat**;
  didokumentasikan sebagai keterbatasan (PRD §10).
- Tidak ada secret ter-commit (`.env*`, `.wrangler/` di `.gitignore`).
- Header keamanan di `public/_headers`: `X-Content-Type-Options`,
  `Permissions-Policy: camera=self, microphone=self, ...`, CSP
  (`default-src 'self'`, `media-src 'self' blob:`, `worker-src 'self'`).
- Dependensi produksi di-sweep OSV tiap CI (HIGH/CRITICAL = gagal).

## 10. CI

`.github/workflows/ci.yml` — 4 job:

| Job | Isi |
|---|---|
| `build` | `npm ci` + `npm run build`; grep bundle (URL kanonis, tautan GitHub, hero landing, tombol kiosk); upload `dist/` |
| `advisory-sweep` | `scripts/advisory-sweep.py` (OSV batch, tanpa auth) |
| `pwa-audit` | Build + `npm run pwa:audit` (manifest + SW + ikon) |
| `playwright-e2e` | Install Chromium + build + `e2e/smoke.spec.js` (kamera palsu) |

## 11. Struktur file

Lihat README (bagian "Struktur proyek"). File terbesar: `styles.css`
(~3.700 baris, design system + kiosk + landing) dan
`OperatorDashboard.jsx` (~1.400 baris).
