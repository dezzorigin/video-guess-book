# Demo & Screenshot — OpenWedding

> Video demo: [demo.mp4](demo/demo.mp4) — alur tamu penuh (sambutan →
> nama → hitung mundur → rekam → pratinjau → simpan → terima kasih) +
> dashboard operator, direkam dengan kamera palsu Playwright.
>
> Screenshot: [screenshots/](screenshots/) — 9 gambar (PNG, 1280×800).

## 1. Yang direkam

Video demo memakai **kamera/mik palsu Chromium** (pola hijau bergerak
sebagai "wajah" tamu + audio palsu), jadi tidak butuh perangkat keras.
Yang terlihat di video adalah alur asli aplikasi di atas build produksi
(`vite preview`), bukan mockup.

## 2. Merekam ulang (lokal)

```bash
npm ci
npm run build
npx playwright install chromium   # sekali saja (butuh ~200 MB)
npx playwright test e2e/demo.spec.js --project=chromium
```

Hasil:

- Video mentah Playwright: `test-results/demo-demo-alur-tamu-penuh-*/video.webm`
- Screenshot: `docs/screenshots/01-welcome.png` … `09-operator-dashboard.png`
  (ditulis langsung oleh spek demo)

Konversi ke MP4 untuk README:

```bash
ffmpeg -y -i test-results/demo-demo-alur-tamu-penuh-*/video.webm \
  -vf "scale=1280:-2" -c:v libx264 -pix_fmt yuv420p -crf 23 \
  docs/demo/demo.mp4
```

Lalu putar `docs/demo/demo.mp4` sekali untuk memastikan suara/gambar
wajar sebelum commit.

## 3. Daftar screenshot

| File | Isi |
|---|---|
| `01-welcome.png` | Layar sambutan (nama mempelai + cara kerja) |
| `02-landing-hero.png` | Landing `#landing` — hero |
| `03-landing-features.png` | Landing — seksi fitur |
| `04-guest-name.png` | Input nama tamu |
| `05-greeting.png` | Hitung mundur 3 detik |
| `06-recording.png` | Layar rekam (kamera palsu + REC + timer) |
| `07-preview.png` | Pratinjau rekaman |
| `08-thankyou.png` | Terima kasih + confetti |
| `09-operator-dashboard.png` | EO Control Center (PIN 1234) |

## 4. Uji e2e (gate CI)

```bash
npx playwright test e2e/smoke.spec.js   # 5 tes: landing, alur penuh,
                                        # lewati nama, PIN, manifest + SW
```

Alur penuh memverifikasi video **benar-benar tersimpan di IndexedDB**
(bukan cuma pindah layar) — membaca store `videos` di `OpenWeddingDB`
setelah "Simpan Ucapan" dan memastikan tamu "Tamu Uji" ada di sana.

## 5. Catatan

- Playwright mengunduh Chromium ~200 MB (`npx playwright install
  chromium`). Di VM ini unduhan dari `cdn.playwright.dev` lambat dan
  pernah putus (`server closed connection`) — ulangi perintahnya bila gagal;
  installer melanjutkan/mengulang otomatis.
- Video demo memakai viewport 1280×800. Untuk demo vertikal (tablet
  kiosk), ubah `setViewportSize` di `e2e/demo.spec.js`.
